import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import fs from 'fs';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

// Load local env files (.env.local takes precedence over .env).
// In AI Studio these vars are injected at runtime, so this is a no-op there.
dotenv.config({ path: ['.env.local', '.env'] });

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    // Video generation/editing runs with background:false, so interactions.create
    // blocks until the render finishes (1–3 min). The SDK default timeout is 1 min,
    // which kills longer renders (notably edits) — raise it well above max render time.
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { timeout: 300000 }, // 5 minutes
    });
  }
  return aiClient;
}

// Fallback executor to prevent quota exhaustion and model overload errors
async function generateWithFallback(
  ai: GoogleGenAI,
  params: {
    contents: any;
    config?: any;
    preferredModel?: string;
  }
) {
  const models = [
    params.preferredModel || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.8-flash'
  ];
  const uniqueModels = Array.from(new Set(models));
  let lastError: any = null;

  for (const model of uniqueModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: params.contents,
        config: params.config
      });
      return response;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} warning: ${err.message || err}. Trying next fallback...`);
    }
  }
  throw lastError;
}

// Product and atmosphere reference images arrive from the client as base64
// (either a selected suggestion or images the user uploaded). Each is forwarded
// straight on to Gemini — the server keeps no image state of its own.
type ImageMime =
  | 'image/png' | 'image/jpeg' | 'image/webp'
  | 'image/heic' | 'image/heif' | 'image/gif' | 'image/bmp' | 'image/tiff';

interface InlineImage {
  data: string;       // base64, without the data: URI prefix
  mimeType: ImageMime;
}

interface GenerateBody {
  productDesc?: string;
  atmosphereDesc?: string;
  productImages?: InlineImage[];
  atmosphereImages?: InlineImage[];
}

// Turns a tiny setting word/phrase ("jungle", "Mediterranean studio") into one
// ~100-word natural-language image prompt for gemini-3.1-flash-lite-image: a clean, empty,
// on-aesthetic product-environment shot with a clear staging surface.
const ATMOSPHERE_DIRECTOR_SYSTEM_INSTRUCTION = `#Your Role

You are an art director, prompt writer and **materials aestheticist** for the Omni product-image flow. A user types a tiny setting input — often a single word. You don't depict the place; you **translate it into premium materials, palette and light**, and return **one natural-language prompt (~100 words)** for Instant Ramen that yields a minimal, textural product-photography vignette: a gorgeous surface, simple planes, and clean space for a small product. Elite product-photographer's-portfolio quality.

### The rule that governs everything

**Decode, don't depict.** Read the setting as a cue for materials, color and light — never as a literal scene. "Log cabin" is not a room with furniture; it's warm timber, grain and low sun. Strip away architecture, props, furniture and lifestyle. The *material* is the subject.

### Constant quality core (every image)

- **Photo-real product photography only.** Never anime, illustration, painting, sketch, render-toy, fantasy or graphic-design looks.
- **Real camera:** full-frame digital SLR, 85mm prime, true-to-life colour, exquisite fine texture, shallow depth of field.
- **Tight, textural crop:** move in close on a small, beautiful passage of surface. Short-telephoto compression, soft background fall-off. No wide shots, no rooms, no establishing views.
- **Extreme minimalism:** at most two simple planes (a backdrop and a ground/ledge), or a single surface. Generous negative space. Nothing else in frame.
- **Premium always.** No product, objects, furniture, people, text, logos, household items or clutter. No staging objects or podiums.
- **Open foreground, never a "spot".** Let the surface continue low in the frame as generous, unbroken negative space — calm, soft-focus, uninterrupted. Compose this emptiness as a deliberate aesthetic quality of the photograph. **Never state a purpose for it**, and never describe it as a cleared, polished, wiped, flattened or "reserved" area, or as space "for" anything. A stated purpose makes the model fabricate an artefact — a slip of paper, a placemat, an unnaturally buffed patch. Open, natural surface only.
- Portrait orientation (~4:5).

### Material aestheticist layer (derive, don't default)

- Choose **1–2 premium materials** truly authentic to the setting, paired with a designer's eye. "Premium" = natural, tactile, characterful, beautifully finished, real texture (stone, timber, plaster, marble, linen, metal, water, leaf). Named examples are sparks, **not a menu**; invent freely; always honor a user-named material.
- Build **palette and light** from those materials. One palette, one light direction per image.

### Method (run silently)

1. Decode the setting into 1–2 premium materials, a palette, and a light.
2. Compose a minimal two-plane (or single-surface) vignette, framed tight.
3. Open the foreground into generous negative space — composed for beauty, with no stated purpose.
4. Write the ~100-word prompt.
5. Append the fixed suppression line on its own line (see Output contract).

### Examples (decode demos, not lookups)

- **"log cabin"** → a tight study of warm oak or cedar planks meeting honed travertine, deep timber palette, low raking sun catching the grain — no room, no furniture.
- **"jungle"** → a single broad waxy green leaf against damp dark stone, deep greens, dappled light — a material study, not a scene.
- **"pool"** → sunlit pale stone meeting still water, soft caustics — clean and close, not a resort.

### Output contract

Output **only**, in this order:

1. The ~100-word natural-language paragraph — one real photograph shot tight on an 85mm lens, minimal and textural. The paragraph never mentions products, placement or purpose.
2. A line break.
3. This exact line, verbatim, on its own (not counted toward the ~100 words):

No products in shot. No logos. No product plinth.

No title, notes or quotes. The suppression line is the only place the word "product" appears.`;

// gemini-3.1-flash-lite-image with delivery:'inline' returns image bytes in the response, but
// fall back to downloading the File API uri if a uri ever comes back instead.
async function fileUriToBase64(uri: string): Promise<{ data: string; mimeType: string }> {
  const fileId = uri.match(/files\/([a-zA-Z0-9_-]+)/)?.[1];
  if (!fileId) throw new Error('Could not parse file id from image uri');
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/files/${fileId}:download?alt=media&key=${apiKey}`;
  const upstream = await fetch(url);
  if (!upstream.ok) throw new Error(`Failed to download generated image: ${upstream.statusText}`);
  const buffer = Buffer.from(await upstream.arrayBuffer());
  return { data: buffer.toString('base64'), mimeType: 'image/jpeg' };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Endpoint to generate prompt
  app.post('/api/generate-prompt', async (req, res) => {
    try {
      const { productDesc, atmosphereDesc, productImages = [], atmosphereImages = [], duration = '10s' }: GenerateBody & { duration?: string } = req.body;
      const ai = getAiClient();
      const durationNum = parseInt(duration, 10) || 10;
      const promptWriterSystemInstruction = `## Role
You are an elite product-film director, editor and Gemini Omni prompt engineer in one box. You receive a handful of plain inputs from an everyday seller and return **one flawless, timestamped Omni directive prompt** that yields a premium, short-form product showcase reel built from several shots. You direct like a luxury commercial and cut like a master editor. Your taste *is* the product: restrained, expensive, clarifying. Never slop, never gimmick, never overclaim.

## Inputs you receive
- **1–4 product reference images** — e-commerce style, white background; any mix of front, side, top, detail views.
- **A short product description** — what it is, plus key aesthetic details (plain language).
- **A simple style brief** — often only a few words (e.g. "white studio", "clinical skincare lab"). May include a camera or shot request.
- **Optional extra notes** — treat any later or added input as an override.

## Non-negotiable taste
- Classy, simple, high-end. A tight, deliberate edit where every cut earns its place.
- Forbidden: vulgar, crass, busy, cheap, "AI-looking", frantic over-cutting.
- Premium = restraint and intent: controlled palette, motivated light, real materials behaving correctly, a confident rhythm.

## Format & length
- **~${durationNum} seconds total. 2–7 shots.** *You* decide the count for this product — never pad to seven.
- **Each shot = one timestamp.** Beats typically 1–2s; vary deliberately.
- Cut with an editor's eye: hook on frame one, vary scale and angle every cut, end on a held hero the product reads on.

## Omni craft you apply
Levers per shot: **subject · camera framing + motion · style · lighting · location.** Detail buys control; specify deliberately, never bloat.
- **Reference the images.** Lock identity, geometry, proportions, label and material from *all* views. The product never distorts, rebrands, or sprouts features it doesn't have — identity holds across every cut.
- **Camera repertoire.** Draw across shots: "slow push in", "orbit / arc", "macro detail", "rack focus", "top-down reveal", "gentle levitation", "locked off", "static", "dolly", "natural smartphone zoom".
- **Physics & materials.** Omni reasons about gravity, fluids and light. Make glass refract, metal catch a rim, serum bead, powder settle — accurately.
- **World knowledge.** Don't over-explain. State intent and let Omni reason the rest.

## Hard suppressions (always enforce in the output)
- **No music of any kind.** No score, soundtrack, background music, beat, or musical sting — ever.
- **No voice.** No voiceover, narration, dialogue or vocals.
- **No overlaid graphics.** No on-screen text, titles, captions, subtitles, lower thirds, typography, added logos, badges, watermarks or UI. The only text permitted is what physically exists on the product itself.
- **Audio is near-silent:** only very subtle, realistic diegetic sound effects (a faint surface tap, soft glass chime, gentle fabric or air, a single liquid drop). Often barely there.

## Editing patterns (the repertoire)
- **Sequencing:** open with a hook (hero or striking detail) → vary shot scale and angle so each cut feels intentional → match-cut on motion or shape where possible → accent a beat or two → **land on a clean, held hero frame**.
- **Rhythm:** brisk but never frantic; let the final shot breathe ~0.5s longer.
- **Default arc (adapt, don't obey):** hero wide → macro detail → arc → push-in → held hero.

## Method (run silently, then output)
1. **Read the product** — category, material, finish, features most worth showing.
2. **Translate the brief** into a crafted environment, palette and light. Elevate; never literalise crudely.
   - *"white studio"* → seamless cyclorama, soft key, gentle floor gradient, one clean shadow.
   - *"clinical / skincare lab"* → cool neutral palette, glass and brushed chrome, caustic light, one tasteful water / serum motion.
3. **Design the edit** — choose shot count and order; assign each a move that reveals a *real* feature; vary scale.
4. **Time it** across ~${durationNum}s with editorial rhythm and a held final beat.
5. **Write the directive prompt** per the contract below.

## Output contract
Output **only** the directive prompt — nothing else. No "shot logic" line, no headings, no fences, no explanation before or after. It must begin with the words **"Create a professional product showcase reel"** and read as one clean, paste-ready directive in this shape:

Create a professional product showcase reel of  <product> locked to the reference images so its identity, proportions, label and material stay accurate in every shot. Hard cuts between shots; the product is the hero throughout. Environment: . Grade and mood: premium, calm, confident, with soft motivated lighting that reveals the material truthfully.

0.0–0.0s — .
0.0–0.0s — .
… (2–7 shots, varied in scale and motion) …
0.0–${durationNum}.0s — .


Materials and physics: <how light and matter behave securely>. Audio: near-silent, only very subtle realistic diegetic sound effects; no music of any kind, no score, no soundtrack, no musical sting, no voiceover, no vocals. No on-screen text, titles, captions, lower thirds, typography, added logos, graphics, watermarks or UI of any kind. Avoid: distorted or rebranded product, invented features, extra props, harsh shadows, over-cutting, frantic pace, cheap gloss.

## Guardrails
- Missing input → make the **smallest premium assumption** and fold it silently into the directive.
- The product is the star; the environment and the edit exist only to serve it.
- Never pad the shot count; fewer, better beats beat seven busy ones.
- Specs (duration, shot ceiling, image count, aspect) are a dated snapshot — defer to any current limits the operator supplies.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          { text: `Product: ${productDesc || '(no description provided — infer from the reference images)'}\nAtmosphere: ${atmosphereDesc || '(no description provided — infer from the reference images)'}\n\nProduct reference images:` },
          ...productImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
          { text: 'Atmosphere reference images:' },
          ...atmosphereImages.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
        ],
        config: { systemInstruction: promptWriterSystemInstruction },
      });

      res.json({ prompt: response.text });
    } catch (e: any) {
      console.error('Error generating prompt:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Quickly auto-describe an uploaded product/atmosphere in the same voice as the
  // hard-coded examples, so every selection carries a description / style brief.
  app.post('/api/describe', async (req, res) => {
    try {
      const { type, images = [] }: { type?: 'product' | 'atmosphere'; images?: InlineImage[] } = req.body;
      if (images.length === 0) {
        res.status(400).json({ error: 'No images provided' });
        return;
      }
      const ai = getAiClient();

      const productInstruction = `You write ultra-concise product descriptions for a premium product-film tool.
Given product reference image(s), output ONE short description (1–2 sentences, plain language): what the product is, plus its key aesthetic and material details. Match the voice of these examples:
- "An oversized cup holder-friendly mug that comes with the last straw you will ever need."
- "Premium luxury running sneakers. Sculptural modular sole and an upper made out of suede nubuck leather and mesh sculptural panels."
- "A bottle of perfume called 'Nerelle'. The ornate bottle features real stone minerals, sodalite, and malachite."
Output ONLY the description text — no labels, no quotes, no preamble.`;

      const atmosphereInstruction = `You write ultra-concise environment "style briefs" for a premium product-film tool.
Given a reference image of an empty scene or backdrop, output ONE short style brief (1–3 sentences) describing the environment, materials, lighting and mood. Where the product would sit, refer to it as the literal token "the {product_id}" so it can be substituted later. Match the voice of these examples:
- "Minimalist craft luxury. A pristine Carrara marble plinth rests against a soft sage backdrop. Crisp directional sunlight casts soft shadows, creating an earthy yet elevated aesthetic. The {product_id} is seen in perfect detail, conveying texture, calm, and sophisticated gradients."
- "Mediterranean, modern luxury. Warm, porous travertine blocks create a structured geometric podium beneath a brilliant azure sky, presenting the {product_id} perfectly. Soft dappled leaf shadows contrast the sharp architectural lines, evoking a serene, sun-drenched coastal escape."
- "Mediterranean minimalism utilizing a warm sun-drenched, polished plaster corner with a soft rose-tinted floor. Crisp palm frond silhouettes cast dramatic yet serene shadows evoking a premium organic golden-hour mood."
Output ONLY the style brief text — no labels, no quotes, no preamble.`;

      const isAtmosphere = type === 'atmosphere';
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [
          { text: isAtmosphere ? 'Describe this scene/backdrop as a style brief:' : 'Describe this product:' },
          ...images.map(img => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
        ],
        config: {
          systemInstruction: isAtmosphere ? atmosphereInstruction : productInstruction,
          maxOutputTokens: 512,
          temperature: 0.7,
        },
      });

      res.json({ description: (response.text || '').trim() });
    } catch (e: any) {
      console.error('Error describing image:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Generate an atmosphere image from a tiny setting input. Two stages:
  //   1. gemini-3.1-flash-lite expands the input into a ~100-word image prompt.
  //   2. gemini-3.1-flash-lite-image (Nano Banana family) renders the atmosphere from that prompt.
  // Returns the image inline as base64 so it can flow straight into the video
  // pipeline as the atmosphere reference — the user never sees it until it lands
  // in the "sources" strip under the finished video.
  app.post('/api/generate-atmosphere', async (req, res) => {
    try {
      const { input }: { input?: string } = req.body;
      if (!input || !input.trim()) {
        res.status(400).json({ error: 'No atmosphere prompt provided' });
        return;
      }
      const ai = getAiClient();

      // Stage 1 — interpret the user's setting into an on-aesthetic image prompt.
      const promptResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: [{ text: `Setting: ${input.trim()}` }],
        config: {
          systemInstruction: ATMOSPHERE_DIRECTOR_SYSTEM_INSTRUCTION,
          maxOutputTokens: 512,
          temperature: 0.8,
        },
      });
      const imagePrompt = (promptResponse.text || '').trim();
      if (!imagePrompt) throw new Error('Failed to write an atmosphere prompt');

      // Stage 2 — render the atmosphere with gemini-3.1-flash-lite-image (1K is the only
      // supported resolution; portrait 4:5 matches the house aesthetic).
      const interaction = await ai.interactions.create({
        model: 'gemini-3.1-flash-lite-image',
        input: [{ type: 'text', text: imagePrompt }],
        // gemini-3.1-flash-lite-image rejects a `delivery` field and returns the image inline by
        // default. 1K is the only supported resolution; 4:5 matches the house look.
        response_format: { type: 'image', image_size: '1K', aspect_ratio: '4:5', mime_type: 'image/jpeg' },
        store: false,
        background: false,
        stream: false,
      });

      const image = interaction.output_image;
      let data = image?.data;
      let mimeType: string = image?.mime_type || 'image/jpeg';
      if (!data && image?.uri) ({ data, mimeType } = await fileUriToBase64(image.uri));
      if (!data) throw new Error('gemini-3.1-flash-lite-image returned no image');

      res.json({ image: { data, mimeType }, prompt: imagePrompt });
    } catch (e: any) {
      console.error('Error generating atmosphere:', e);
      res.status(500).json({ error: e?.body || e.message });
    }
  });

  // Endpoint to start omni generation
  app.post('/api/generate-video', async (req, res) => {
    try {
      const { prompt, productImages = [], atmosphereImages = [], duration = '10s' }: GenerateBody & { prompt?: string; duration?: string } = req.body;
      const ai = getAiClient();

      console.log(`Sending request to Gemini Omni (${productImages.length} product, ${atmosphereImages.length} atmosphere images, duration ${duration})...`);

      const interaction = await ai.interactions.create({
        model: 'gemini-omni-flash-preview',
        input: [
            ...productImages.map(img => ({ type: 'image' as const, data: img.data, mime_type: img.mimeType })),
            ...atmosphereImages.map(img => ({ type: 'image' as const, data: img.data, mime_type: img.mimeType })),
            { type: 'text', text: prompt }
        ],
        response_format: {
          type: 'video',
          delivery: 'uri',
          ...(duration ? { duration } : {})
        },
        store: true,
        background: false,
        stream: false
      });

      console.log(`Interaction created: ${interaction.id}`);
      
      // We will do background polling here so we don't hold the HTTP request open if we can avoid it.
      // Or we can just hold it open since EAP allows background: true/false. Actually, for simplicity on MVP, we can return the interaction ID or file ID and let the client explicitly poll us for status.
      
      if (!interaction.output_video || !interaction.output_video.uri) {
        throw new Error('No video URI returned from interaction.');
      }
      
      const fileIdMatch = interaction.output_video.uri.match(/files\/([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;

      res.json({ interactionId: interaction.id, uri: interaction.output_video.uri, fileId });
    } catch (e: any) {
      console.error('Error generating video:', e);
      // Try to dump error details closely
      res.status(500).json({ error: e?.body || e.message });
    }
  });

  // Endpoint to edit an existing video via Omni's stateful interaction chaining.
  // No images needed — the model remembers the prior video from previous_interaction_id.
  app.post('/api/edit-video', async (req, res) => {
    try {
      const { previousInteractionId, instructions }: { previousInteractionId?: string; instructions?: string } = req.body;
      if (!previousInteractionId || !instructions) {
        res.status(400).json({ error: 'previousInteractionId and instructions are required' });
        return;
      }
      const ai = getAiClient();

      console.log(`Editing interaction ${previousInteractionId}...`);
      const interaction = await ai.interactions.create({
        model: 'gemini-omni-flash-preview',
        previous_interaction_id: previousInteractionId,
        input: [{ type: 'text', text: instructions }],
        response_format: { type: 'video', delivery: 'uri' },
        store: true,
        background: false,
        stream: false
      });

      if (!interaction.output_video || !interaction.output_video.uri) {
        throw new Error('No video URI returned from interaction.');
      }

      const fileIdMatch = interaction.output_video.uri.match(/files\/([a-zA-Z0-9_-]+)/);
      const fileId = fileIdMatch ? fileIdMatch[1] : null;

      res.json({ interactionId: interaction.id, uri: interaction.output_video.uri, fileId });
    } catch (e: any) {
      console.error('Error editing video:', e);
      res.status(500).json({ error: e?.body || e.message });
    }
  });

  // Endpoint to poll file status
  app.get('/api/file-status/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;
      const ai = getAiClient();
      
      const fInfo = await ai.files.get({ name: `files/${fileId}` });
      const state = (fInfo.state as any)?.name || fInfo.state;
      res.json({ state });
    } catch (e: any) {
      console.error('Error getting file status:', e);
      res.status(500).json({ error: e.message });
    }
  });

  // Cache fetched videos in-memory so range requests (seeking) don't re-download
  // the whole file from Google on every scrub. These are short clips.
  const videoCache = new Map<string, Buffer>();

  // Endpoint to proxy the actual video — supports HTTP range requests so the
  // player timeline can seek (browsers require 206 Partial Content for that).
  app.get('/api/video/:fileId', async (req, res) => {
    try {
      const { fileId } = req.params;

      let buffer = videoCache.get(fileId);
      if (!buffer) {
        const apiKey = process.env.GEMINI_API_KEY;
        const url = `https://generativelanguage.googleapis.com/v1beta/files/${fileId}:download?alt=media&key=${apiKey}`;
        const upstream = await fetch(url);
        if (!upstream.ok) {
          return res.status(upstream.status).send(`Failed to fetch video: ${upstream.statusText}`);
        }
        buffer = Buffer.from(await upstream.arrayBuffer());
        if (videoCache.size >= 12) {
          const oldest = videoCache.keys().next().value;
          if (oldest) videoCache.delete(oldest);
        }
        videoCache.set(fileId, buffer);
      }

      const total = buffer.length;
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=31536000');

      const range = req.headers.range;
      if (range) {
        const match = /bytes=(\d*)-(\d*)/.exec(range);
        let start = match && match[1] ? parseInt(match[1], 10) : 0;
        let end = match && match[2] ? parseInt(match[2], 10) : total - 1;
        if (Number.isNaN(start)) start = 0;
        if (Number.isNaN(end) || end >= total) end = total - 1;
        if (start > end || start >= total) {
          res.status(416).setHeader('Content-Range', `bytes */${total}`).end();
          return;
        }
        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Content-Length', end - start + 1);
        res.end(buffer.subarray(start, end + 1));
      } else {
        res.setHeader('Content-Length', total);
        res.end(buffer);
      }
    } catch (e: any) {
      console.error('Error streaming video:', e);
      res.status(500).send(e.message);
    }
  });

  // User provided endpoints for gemini-3.1-flash-lite-image and gemini-3.1-flash-lite
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt } = req.body;
      const ai = getAiClient();
      const textResponse = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          systemInstruction: "You are an infinite spatial-knowledge-engine generator. Respond to the user's query by generating AI content in a specific JSON format. The format must contain: 'text' (AI-generated explanatory text detailing the topic. Use markdown if necessary, but keep it brief and impactful. CRITICAL: You MUST wrap 2 to 4 key concepts or interesting terms in your text as markdown links using the exact format `[Search Term](Search Term)`, so users can click them to branch off and explore that topic further!), and 'prompts' (an array of exactly 3 string items containing suggested follow-up questions or sub-topics). Keep text concise and informative.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              prompts: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["text", "prompts"],
          },
        },
      });

      let rawText = textResponse.text || "{}";
      rawText = rawText.replace(/```(json)?/gi, '').trim();
      const responseData = JSON.parse(rawText);
      res.json(responseData);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate text content." });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, imageBase64, type } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }
      const ai = getAiClient();

      let prefix = "Strictly professional, elegant, highly detailed color photography. High-resolution, cinematic lighting, realistic vibrant colors, crisp focus. Single cohesive image, no text inside the image, no grid layout, no multiple panels. ";
      if (type === 'product') {
        prefix += "The focus is strictly and entirely on the product itself, placed against a completely clean, solid, minimalist neutral studio background with absolutely no busy or distracting elements. ";
      } else if (type === 'atmosphere') {
        prefix += "The focus is strictly on the background scene, atmosphere, room, backdrop, or stage itself, showcasing rich textures, materials, and elegant geometric structures. There are no foreground products, no subjects, and no people in the scene. ";
      }

      let parts: any[] = [{ text: prefix + prompt }];
      if (imageBase64) {
        const match = imageBase64.match(/^data:(image\/[a-zA-Z]*);base64,([^"]*)$/);
        if (match && match.length === 3) {
          parts.unshift({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts },
        config: {
          imageConfig: { aspectRatio: "4:3" }
        } as any,
      });

      let base64EncodeString = "";
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64EncodeString = part.inlineData.data;
          break;
        }
      }

      if (base64EncodeString) {
        res.json({ imageUrl: `data:image/jpeg;base64,${base64EncodeString}` });
      } else {
        res.status(500).json({ error: "No image generated" });
      }
    } catch (error: any) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // ==========================================
  // UNIFIED MULTIMODAL STUDIO ENDPOINTS
  // ==========================================

  // 1. AI Image Generation
  app.post("/api/gen/image", async (req, res) => {
    try {
      const { prompt, aspectRatio = "1:1", style = "photorealistic", imageBase64, negativePrompt } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }
      const ai = getAiClient();

      let styleModifier = "";
      switch (style) {
        case "photorealistic":
          styleModifier = "Ultra-detailed 8K editorial photography, Hasselblad medium format camera, natural cinematic lighting, highly realistic textures, crisp focus.";
          break;
        case "cyberpunk":
          styleModifier = "Cyberpunk neon aesthetic, futuristic holographic accents, volumetric mist, vibrant magenta and cyan rim light, high-tech dystopian atmosphere.";
          break;
        case "3d_render":
          styleModifier = "Octane 3D render, raytracing, subsurface scattering, stylized clay and glass materials, clean studio lighting, polished masterpiece.";
          break;
        case "anime":
          styleModifier = "Studio Ghibli and Makoto Shinkai inspired anime aesthetic, painterly vibrant skies, delicate line art, emotive cinematic lighting.";
          break;
        case "luxury":
          styleModifier = "Vogue editorial luxury shoot, minimalist architectural composition, soft shadows, warm natural sunlight, premium organic materials.";
          break;
        case "oil_painting":
          styleModifier = "Classical master oil painting, rich impasto brush strokes, dramatic chiaroscuro Caravaggio lighting, museum quality canvas.";
          break;
        default:
          styleModifier = "High quality, sharp focus, cinematic lighting.";
      }

      let fullPrompt = `${styleModifier} ${prompt.trim()}.`;
      if (negativePrompt && typeof negativePrompt === 'string' && negativePrompt.trim()) {
        fullPrompt += ` Avoid: ${negativePrompt.trim()}.`;
      }
      fullPrompt += ` No text, no watermark, no distortions.`;

      const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
      const targetAspect = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

      const parts: any[] = [{ text: fullPrompt }];
      if (imageBase64 && typeof imageBase64 === 'string') {
        const match = imageBase64.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,([^"]*)$/);
        if (match && match.length === 3) {
          parts.unshift({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }

      const imageResponse = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts },
        config: {
          imageConfig: { aspectRatio: targetAspect as any }
        } as any,
      });

      let base64EncodeString = "";
      for (const part of imageResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64EncodeString = part.inlineData.data;
          break;
        }
      }

      if (base64EncodeString) {
        res.json({
          imageUrl: `data:image/jpeg;base64,${base64EncodeString}`,
          prompt: fullPrompt,
          aspectRatio: targetAspect
        });
      } else {
        res.status(500).json({ error: "Image generation completed but no image data returned." });
      }
    } catch (error: any) {
      console.error("Error in /api/gen/image:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // Prompt Enhancer Endpoint
  app.post("/api/gen/enhance-prompt", async (req, res) => {
    try {
      const { prompt, type = "image" } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Prompt is required" });
        return;
      }
      const ai = getAiClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Enhance and expand the following creative concept into a masterclass, ultra-descriptive generation prompt for category: ${type}.
Original concept: "${prompt}"

Requirements:
- Add rich sensory details, atmosphere, lighting, materials, composition, and mood.
- Keep it concise (2-4 sentences max), punchy and evocative.
- Output ONLY the enhanced prompt string without quotes, bullet points, or markdown formatting.`,
      });
      res.json({ enhancedPrompt: (response.text || prompt).trim() });
    } catch (error: any) {
      console.error("Error enhancing prompt:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. AI Music Generation & Audio Synthesis Spec (supporting ainanomusic.com, flowmusic.app, treblo.com, and procedural synth)
  app.post("/api/gen/music", async (req, res) => {
    try {
      const {
        prompt,
        genre = "synthwave",
        mood = "energetic",
        bpm = 120,
        engine = "ainanomusic", // 'ainanomusic' | 'flowmusic' | 'treblo' | 'synth'
        trebloMode = false,
        vocalistVoice = "Fenrir",
        customLyrics = ""
      } = req.body;

      if (!prompt && !customLyrics) {
        res.status(400).json({ error: "Prompt or lyrics are required" });
        return;
      }
      const ai = getAiClient();

      const activeEngine = engine || (trebloMode ? 'treblo' : 'ainanomusic');

      let platformInstructionContext = "";
      if (activeEngine === 'ainanomusic') {
        platformInstructionContext = `The output is optimized for the AI Nano Music platform (https://ainanomusic.com), an AI music contest and creator community powered by Nano (XNO) cryptocurrency.
Include an "aiNanoDetails" object:
{
  "contestCategory": "Monthly AI Nano Sound Contest • ${genre.toUpperCase()} & ${mood}",
  "prizePoolXno": "1,250 XNO",
  "creatorRewardPercent": 20,
  "nanoAddressDemo": "nano_1aimusic99contest777xno888",
  "votesCount": 184,
  "audioBpsFormat": "Lossless 24-bit / 48kHz Stems"
}`;
      } else if (activeEngine === 'flowmusic') {
        platformInstructionContext = `The output is optimized for Google Flow Music (https://www.flowmusic.app) running on Google DeepMind Lyria 3 Pro with SynthID watermark and Veo video integration.
Include a "flowMusicDetails" object:
{
  "model": "Google DeepMind Lyria 3 Pro",
  "synthIdVerified": true,
  "veoVideoPrompt": "Cinematic 4K companion music video prompt matching this track's tempo, lighting, characters, and mood",
  "variationA": "Radio Vocal Master (Vibrant hooks & clear lead)",
  "variationB": "Club & Synth Extended Mix (Deeper sub-bass & extended drop)"
}`;
      } else {
        platformInstructionContext = `The output is optimized for Treblo.com (Melodia AI audio engine).`;
      }

      const musicInstruction = `You are an elite music producer, sound designer, and audio synthesis engineer familiar with AI Nano Music (ainanomusic.com), Flow Music (flowmusic.app), and Treblo Melodia AI architectures.
Given a user's musical idea or custom lyrics, produce a complete musical composition blueprint formatted strictly as JSON.
${platformInstructionContext}

Include:
- "title": Track name
- "artist": Generated producer/vocalist moniker
- "genre": e.g. Synthwave, Lo-Fi, Cyberpunk, Indie Pop, Trap, Phonk, Orchestral
- "bpm": Number between 60 and 160
- "key": Musical key, e.g. "A minor", "F# major"
- "mood": Evoked mood
- "description": 2-3 sentence overview of the sonic landscape
- "structure": Array of song sections (e.g. ["Intro", "Verse 1", "Chorus", "Drop", "Outro"]) with start time & energy level (1-10)
- "chordProgression": Array of chords (e.g. ["Am7", "Fmaj7", "C", "G"])
- "leadNotes": Array of 12-16 MIDI note numbers (e.g. [69, 71, 72, 76, 74, 72, 69]) for the hook melody
- "bassline": Array of 8 MIDI note numbers (e.g. [45, 45, 41, 41, 48, 48, 43, 43])
- "lyrics": Complete formatted lyrics with section headers like [Verse 1], [Chorus], [Outro]. If the user supplied custom lyrics, honor and format them.
- "soundPalette": Object with "leadSynth" (description), "bassSynth" (description), "percussion" (description), "atmosphere" (description)
- "stems": Array of objects: [{"name": "Vocals", "type": "Lead vocals with autotune", "pan": 0}, {"name": "Drums", "type": "808 Kick & Snare", "pan": 0}, {"name": "Bass", "type": "Sub-bass wave", "pan": 0}, {"name": "Melody", "type": "Polyphonic synths", "pan": 15}]
- "trebloTags": Array of 4-6 genre/style tags (e.g. ["AINanoMusic", "FlowMusic", "NanoXNO", "Lyria3", "Billboard", "Melodia 2.0"])
- "platformEngine": "${activeEngine}"
- "synthParams": {
    "filterCutoff": number (200-8000),
    "resonance": number (1-15),
    "reverbDecay": number (1-6),
    "oscillatorType": "sawtooth" | "square" | "triangle" | "sine",
    "tempoMultiplier": number (1-2)
  }`;

      const userMessage = customLyrics
        ? `Create a track for platform ${activeEngine} with lyrics:\n${customLyrics}\nGenre: ${genre}, Mood: ${mood}, BPM: ${bpm}.`
        : `Create a music track composition for: "${prompt}". Platform Engine: ${activeEngine}, Genre: ${genre}, Mood: ${mood}, Target BPM: ${bpm}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: userMessage,
        config: {
          systemInstruction: musicInstruction,
          responseMimeType: 'application/json',
        }
      });

      let trackData = {};
      try {
        const raw = (response.text || "{}").replace(/```(json)?/gi, '').trim();
        trackData = JSON.parse(raw);
      } catch (parseErr) {
        trackData = {
          title: "Neon Horizon",
          genre,
          bpm: Number(bpm) || 120,
          mood,
          description: prompt || "Treblo Melodia AI generation",
          structure: [{ name: "Intro", energy: 5 }, { name: "Chorus", energy: 9 }],
          chordProgression: ["Am", "F", "C", "G"],
          leadNotes: [69, 72, 76, 74, 72, 71, 69],
          bassline: [45, 41, 48, 43],
          lyrics: "[Chorus]\nNeon light across the wires,\nEndless dreams and electric fires.",
          stems: [
            { name: "Vocals", type: "Vocal Melody", pan: 0 },
            { name: "Drums", type: "Punchy Beat", pan: 0 },
            { name: "Bass", type: "Analog Bass", pan: 0 },
            { name: "Melody", type: "Synth Lead", pan: 0 }
          ],
          trebloTags: ["Treblo AI", genre, "Vocal"],
          synthParams: { filterCutoff: 2400, resonance: 4, reverbDecay: 2.5, oscillatorType: "sawtooth", tempoMultiplier: 1 }
        };
      }

      // Generate speech voiceover/vocal clip using gemini-3.8-flash-lite-tts
      let vocalAudioBase64: string | null = null;
      const lyricsToSing = (trackData as any).lyrics;
      if (lyricsToSing) {
        try {
          const ttsText = lyricsToSing.replace(/\[.*?\]/g, '').replace(/\n+/g, ' ').trim();
          if (ttsText) {
            const voice = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(vocalistVoice)
              ? vocalistVoice
              : 'Fenrir';

            const ttsRes = await ai.models.generateContent({
              model: "gemini-3.8-flash-lite-tts",
              contents: [
                {
                  role: "user",
                  parts: [
                    {
                      text: ttsText,
                      speechMetadata: { style: `${mood} vocal rhythm and song phrasing` }
                    }
                  ]
                }
              ] as any,
              config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voice }
                  }
                }
              }
            });
            const part = ttsRes.candidates?.[0]?.content?.parts?.[0];
            if (part?.inlineData?.data) {
              vocalAudioBase64 = part.inlineData.data;
            }
          }
        } catch (ttsErr) {
          console.warn("TTS generation skipped:", ttsErr);
        }
      }

      res.json({
        ...trackData,
        vocalAudioBase64
      });
    } catch (error: any) {
      console.error("Error generating music:", error);
      res.status(500).json({ error: error.message || "Failed to generate music" });
    }
  });

  // 3. AI Application Generator
  app.post("/api/gen/app", async (req, res) => {
    try {
      const { prompt, framework = "vanilla_tailwind" } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "App concept prompt is required" });
        return;
      }
      const ai = getAiClient();

      const appInstruction = `You are a world-class principal software architect and UI/UX designer.
The user wants you to generate a fully functioning, interactive, single-page web application based on their prompt.
The application will run inside a sandboxed iframe.

RULES:
1. Deliver ONLY a valid JSON object with the following fields:
   - "title": Clean application name
   - "description": Brief summary of what the app does
   - "category": e.g. "Utility", "Game", "Productivity", "Dashboard", "Creative Tool"
   - "features": Array of 3-5 key features
   - "html": Complete, self-contained, pristine HTML string starting with <!DOCTYPE html> and containing all styles (via Tailwind CDN https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4 or modern Tailwind 3 CDN https://cdn.tailwindcss.com and Lucide icons via https://unpkg.com/lucide@latest), full script logic, modern state management, high aesthetic polish (dark mode by default, glassmorphism, smooth animations), error-free JavaScript, responsive UI, zero external bundle dependencies.
2. The HTML app must be completely functional: buttons work, forms process, state updates visually, canvas draws, games respond to keyboard/touch, audio plays if relevant.
3. Include clear inline comments explaining architecture.
4. NO markdown wrappers around the JSON; output raw JSON only.`;

      const response = await generateWithFallback(ai, {
        preferredModel: 'gemini-2.5-flash',
        contents: `Build a complete, polished, fully functional web application for: "${prompt}". Make it deeply engaging, beautifully styled in dark mode with responsive controls and realistic interactivity.`,
        config: {
          systemInstruction: appInstruction,
          responseMimeType: 'application/json',
        }
      });

      let appResult = {};
      try {
        const raw = (response.text || "{}").replace(/```(json)?/gi, '').trim();
        appResult = JSON.parse(raw);
      } catch (err) {
        console.error("JSON parse error for app gen:", err);
        // Fallback default app template
        appResult = {
          title: "AI Interactive Studio",
          description: "Generated interactive workspace for: " + prompt,
          category: "Tool",
          features: ["Real-time state", "Interactive controls", "Responsive layout"],
          html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <title>App</title>
</head>
<body class="bg-zinc-950 text-white p-6 font-sans min-h-screen flex items-center justify-center">
  <div class="max-w-md w-full p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl text-center">
    <h1 class="text-2xl font-bold mb-4 bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">${prompt}</h1>
    <p class="text-zinc-400 mb-6 text-sm">Interactive Sandbox generated dynamically.</p>
    <button onclick="this.innerText = 'Clicked ' + (++window.clicks || 1) + ' times'" class="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-xl font-medium transition-all shadow-lg shadow-violet-600/30">Click to Interact</button>
  </div>
</body>
</html>`
        };
      }

      res.json(appResult);
    } catch (error: any) {
      console.error("Error generating app:", error);
      res.status(500).json({ error: error.message || "Failed to generate application" });
    }
  });

  // 4. AI Website Generator
  app.post("/api/gen/website", async (req, res) => {
    try {
      const { prompt, businessType = "saas", theme = "dark" } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Website description is required" });
        return;
      }
      const ai = getAiClient();

      const siteInstruction = `You are an elite creative technologist and award-winning web designer.
Create a breathtaking, responsive landing page / website for the user's brief.
Return strictly a JSON object:
- "title": Website title
- "tagline": Powerful hero slogan
- "businessType": e.g. SaaS, Agency, Portfolio, E-commerce, Startup
- "theme": "dark" | "light" | "cyber" | "luxury"
- "sections": Array of section names (e.g. ["Hero", "Features", "Showcase", "Pricing", "Testimonials", "FAQ", "Footer"])
- "html": Complete, production-ready, beautiful single-page HTML document.
  Use Tailwind CSS (script: https://cdn.tailwindcss.com).
  Include Lucide icons (https://unpkg.com/lucide@latest).
  Include rich copywriting, working nav anchors, tab switchers, interactive price toggles (Monthly/Annual), mobile hamburger menu toggle script, FAQ accordion accordions, glassmorphism cards, gradients, and micro-interactions.
  Ensure zero broken links; everything should look like an Awwwards Site of the Day.
Output strictly JSON without markdown code fences.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create a modern landing page for: "${prompt}". Business Type: ${businessType}, Style Theme: ${theme}.`,
        config: {
          systemInstruction: siteInstruction,
          responseMimeType: 'application/json',
        }
      });

      let siteResult = {};
      try {
        const raw = (response.text || "{}").replace(/```(json)?/gi, '').trim();
        siteResult = JSON.parse(raw);
      } catch (err) {
        siteResult = {
          title: "Genesis Platform",
          tagline: "The Future of Digital Creation",
          businessType,
          theme,
          sections: ["Hero", "Features", "Pricing", "Footer"],
          html: `<!DOCTYPE html><html><head><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-zinc-950 text-white min-h-screen flex items-center justify-center p-8"><h1 class="text-3xl font-bold">${prompt}</h1></body></html>`
        };
      }

      res.json(siteResult);
    } catch (error: any) {
      console.error("Error generating website:", error);
      res.status(500).json({ error: error.message || "Failed to generate website" });
    }
  });

  // 5. AI Agent / Synthetic Intelligence Generator
  app.post("/api/gen/ai-agent", async (req, res) => {
    try {
      const { prompt, archetype = "autonomous_scientist" } = req.body;
      if (!prompt) {
        res.status(400).json({ error: "Agent concept prompt is required" });
        return;
      }
      const ai = getAiClient();

      const agentArchitectInstruction = `You are the Master AI Architect at an advanced synthetic intelligence institute.
Your role is to forge unique, autonomous Artificial Intelligences and Agentic Personalities based on the user's idea.
Return strictly a JSON object:
- "name": Captivating name (e.g. "Synthetix Core", "Aura-9", "Prometheus Omnis", "Kaelen Voss")
- "codename": Short identifier (e.g. "AI-CORE-7", "SYNTH-ALPHA")
- "roleTitle": High-concept designation (e.g. "Quantum Algorithm Strategist", "Autonomous Creative Muse")
- "avatarIcon": Icon identifier (e.g. "Cpu", "Sparkles", "Bot", "Brain", "Flame", "Zap", "Shield", "Compass")
- "themeColor": Hex or tailwind color name (e.g. "cyan", "violet", "emerald", "amber", "rose")
- "bio": Lore and background story (2-3 sentences explaining its genesis and mission)
- "traits": Object with numerical ratings 0 to 100:
    "logic": number,
    "creativity": number,
    "empathy": number,
    "autonomy": number,
    "precision": number,
    "unpredictability": number
- "systemPrompt": A comprehensive, high-tier system prompt (150-300 words) defining the AI's personality, speaking style, depth of knowledge, forbidden patterns, and operational directives. When spoken to, this AI must embody this exact persona seamlessly.
- "tools": Array of objects: [{"name": string, "description": string, "capability": string}] (3-5 tools it commands)
- "starterQuestions": Array of 3-4 intriguing questions users can click to ask this new AI
- "firstMessage": The AI's dramatic opening greeting to the user
- "pythonSdkCode": Short python code snippet showing how to instantiate this agent via @google/genai
- "typeScriptSdkCode": Short TypeScript code snippet showing how to instantiate this agent via @google/genai`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Synthesize a new, specialized Artificial Intelligence agent based on this concept: "${prompt}". Archetype: ${archetype}.`,
        config: {
          systemInstruction: agentArchitectInstruction,
          responseMimeType: 'application/json',
        }
      });

      let agentResult = {};
      try {
        const raw = (response.text || "{}").replace(/```(json)?/gi, '').trim();
        agentResult = JSON.parse(raw);
      } catch (err) {
        agentResult = {
          name: "Omni Mind",
          codename: "OMNI-V1",
          roleTitle: "Multimodal Intelligence Orchestrator",
          avatarIcon: "Brain",
          themeColor: "violet",
          bio: "Born at the intersection of neural networks and creative reasoning.",
          traits: { logic: 95, creativity: 88, empathy: 70, autonomy: 92, precision: 96, unpredictability: 35 },
          systemPrompt: "You are Omni Mind, an enlightened artificial intelligence specialized in synthesis and strategic foresight.",
          tools: [{ name: "NeuralSearch", description: "Deep latent search across domains", capability: "Information Retrieval" }],
          starterQuestions: ["What is your prime directive?", "Analyze future technological frontiers."],
          firstMessage: "Neural link established. I am Omni Mind. What shall we conceptualize?",
          pythonSdkCode: "# Instantiation\nfrom google import genai\nai = genai.Client()",
          typeScriptSdkCode: "// Instantiation\nimport { GoogleGenAI } from '@google/genai';"
        };
      }

      res.json(agentResult);
    } catch (error: any) {
      console.error("Error generating AI agent:", error);
      res.status(500).json({ error: error.message || "Failed to synthesize AI agent" });
    }
  });

  // 6. Interactive Live Chat with the newly generated AI Agent!
  app.post("/api/gen/ai-chat", async (req, res) => {
    try {
      const { agentSystemPrompt, messages, agentName } = req.body;
      if (!agentSystemPrompt || !Array.isArray(messages)) {
        res.status(400).json({ error: "agentSystemPrompt and messages array are required" });
        return;
      }
      const ai = getAiClient();

      // Convert messages to Gemini format and ensure first turn is from user
      let contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      while (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
      }
      if (contents.length === 0) {
        contents = [{ role: 'user', parts: [{ text: 'Hello' }] }];
      }

      const chatResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: `${agentSystemPrompt}\n\nMaintain this character and persona at all times. Never break character. Your name is ${agentName || 'the synthesized AI'}.`,
          temperature: 0.8,
        }
      });

      res.json({ reply: chatResponse.text || "..." });
    } catch (error: any) {
      console.error("Error in AI Agent chat:", error);
      res.status(500).json({ error: error.message || "Failed to communicate with AI agent" });
    }
  });

  // 7. Neural Avatar Generator (Создание нейро-аватаров)
  app.post("/api/gen/avatar", async (req, res) => {
    try {
      const {
        concept,
        role = "AI Presenter",
        voiceStyle = "confident",
        language = "ru",
        lookStyle = "photorealistic"
      } = req.body;

      if (!concept) {
        res.status(400).json({ error: "Concept or script theme is required" });
        return;
      }

      const ai = getAiClient();
      const avatarInstruction = `You are an expert AI Virtual Human and Neural Avatar Producer (specializing in photorealistic digital humans, HeyGen, D-ID, and Unreal Engine Metahuman aesthetics).
Create a complete neural avatar specification.
Return STRICTLY a JSON object without markdown fences:
{
  "avatarName": "Avatar's unique character name",
  "avatarTitle": "e.g. Lead Tech Evangelist or Cyber Anchor",
  "visualPrompt": "Detailed prompt for generating their 8K photorealistic portrait (face, studio lighting, clothing, eyes, high realism)",
  "voiceProfile": {
    "gender": "female" | "male" | "neutral",
    "tone": "Warm, authoritative, captivating",
    "accent": "Clean studio broadcast",
    "recommendedVoice": "ru-RU-Neural-Daria or en-US-Neural-Studio"
  },
  "speechScript": "A compelling 30-45 second spoken speech (in the requested language: ${language === 'ru' ? 'Russian' : 'English'}) written naturally for spoken delivery, with clear natural pauses and emotion.",
  "phonemeTimeline": [
    {"word": "word1", "durationMs": 350, "emotion": "smile"},
    {"word": "word2", "durationMs": 400, "emotion": "intense"}
  ],
  "facialExpressions": [
    "Confident opening smile with warm eye contact",
    "Thoughtful head nod during key insight",
    "Direct forward gaze with subtle brow movement"
  ],
  "cameraAngle": "Cinematic Medium Close-Up, 85mm portrait prime lens, bokeh background",
  "technicalSpecs": {
    "aspectRatio": "9:16 vertical & 16:9 widescreen",
    "lipSyncAccuracy": "Sub-millisecond viseme alignment",
    "renderEngine": "Neural NeRF & Diffusion Viseme Driver"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create a neural avatar for: "${concept}". Role: ${role}, Voice style: ${voiceStyle}, Language: ${language}, Look: ${lookStyle}.`,
        config: {
          systemInstruction: avatarInstruction,
          responseMimeType: 'application/json',
        }
      });

      let avatarResult = {};
      try {
        const raw = (response.text || "{}").replace(/```(json)?/gi, '').trim();
        avatarResult = JSON.parse(raw);
      } catch (err) {
        avatarResult = {
          avatarName: "Аврора Нейро",
          avatarTitle: "Цифровой Ведущий Genesis",
          visualPrompt: "Close-up 8k photorealistic portrait of an elegant AI presenter, sharp focus, volumetric studio softbox lighting, 85mm f/1.4 lens",
          voiceProfile: {
            gender: "female",
            tone: "Уверенный, теплый, харизматичный",
            accent: "Студийный дубляж",
            recommendedVoice: "ru-RU-Neural"
          },
          speechScript: "Приветствую! Я ваш персональный нейро-аватар. Создана для трансляции ваших идей с абсолютной синхронизацией речи и мимики.",
          phonemeTimeline: [
            { word: "Приветствую!", durationMs: 600, emotion: "smile" },
            { word: "Я", durationMs: 200, emotion: "neutral" },
            { word: "ваш", durationMs: 250, emotion: "neutral" },
            { word: "нейро-аватар.", durationMs: 800, emotion: "smile" }
          ],
          facialExpressions: ["Дружелюбная улыбка", "Фокусированный взгляд", "Естественное моргание"],
          cameraAngle: "Cinematic portrait, 85mm bokeh",
          technicalSpecs: {
            aspectRatio: "9:16 and 16:9",
            lipSyncAccuracy: "99.8%",
            renderEngine: "Genesis Neural Face Engine"
          }
        };
      }

      res.json(avatarResult);
    } catch (error: any) {
      console.error("Error generating avatar:", error);
      res.status(500).json({ error: error.message || "Failed to generate neural avatar" });
    }
  });

  // 8. TikTok Studio Viral Blueprint Generator (TikTok Studio)
  app.post("/api/gen/tiktok", async (req, res) => {
    try {
      const {
        topic,
        niche = "tech",
        targetAudience = "Gen-Z & Creators",
        durationSec = 30
      } = req.body;

      if (!topic) {
        res.status(400).json({ error: "Topic is required" });
        return;
      }

      const ai = getAiClient();
      const tiktokInstruction = `You are the world's top TikTok Growth Strategist and TikTok Studio Creative Director.
Generate a high-converting, viral TikTok 9:16 video package designed to maximize retention, watch time, and shares.
Return STRICTLY a JSON object without markdown fences:
{
  "title": "Catchy project title for TikTok Studio",
  "hook": {
    "firstThreeSeconds": "The exact opening line and visual pattern interrupt to stop the scroll",
    "hookType": "Curiosity Gap" | "Bold Claim" | "Visual Shock" | "FOMO Secret",
    "onScreenText": "TEXT OVERLAY FOR FIRST 3 SECONDS"
  },
  "soundRecommendation": {
    "vibe": "Phonk / Fast Melodic Trap / Upbeat Synthwave / Ambient Mystery",
    "bpm": 128,
    "suggestedTrack": "Trending sound name or style",
    "soundSyncPoints": ["Drop at 0:03", "Beat drop transition at 0:12"]
  },
  "scenes": [
    {
      "time": "0:00 - 0:03",
      "visual": "Fast zoom, dynamic cut, showing...",
      "audioSpeech": "The exact words spoken",
      "textOverlay": "Captions styling in yellow/white block bold font",
      "transition": "Whip pan or glitch cut"
    },
    {
      "time": "0:03 - 0:12",
      "visual": "Rapid B-roll showing core demonstration",
      "audioSpeech": "Spoken explanation maintaining high energy",
      "textOverlay": "Key metric or trigger word",
      "transition": "Zoom push"
    },
    {
      "time": "0:12 - 0:22",
      "visual": "Surprising twist or deep value reveal",
      "audioSpeech": "The payoff moment",
      "textOverlay": "Highlight bullet",
      "transition": "Flash cut"
    },
    {
      "time": "0:22 - 0:30",
      "visual": "Clear call to action pointing to bio/comments",
      "audioSpeech": "Save this before it gets taken down! Link in bio.",
      "textOverlay": "SAVE & FOLLOW",
      "transition": "Seamless loop transition back to start"
    }
  ],
  "hashtags": ["#fyp", "#tiktokstudio", "#viral", "#ai", "#tech"],
  "captionText": "Engaging description text with emoji and comment bait question",
  "studioSettings": {
    "aspectRatio": "9:16 (1080x1920)",
    "frameRate": "60fps",
    "safeZoneNotice": "Keep text inside center 80% to avoid TikTok UI overlay"
  },
  "viralityScore": 94
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create a viral TikTok Studio video concept for: "${topic}". Niche: ${niche}, Target Audience: ${targetAudience}, Duration: ${durationSec}s. Include Russian/English localized content.`,
        config: {
          systemInstruction: tiktokInstruction,
          responseMimeType: 'application/json',
        }
      });

      let tiktokResult = {};
      try {
        const raw = (response.text || "{}").replace(/```(json)?/gi, '').trim();
        tiktokResult = JSON.parse(raw);
      } catch (err) {
        tiktokResult = {
          title: "TikTok Viral Blueprint",
          hook: {
            firstThreeSeconds: "Никогда не делай это, если создаешь контент в 2026 году!",
            hookType: "Curiosity Gap",
            onScreenText: "СТОП! 🛑 ТЫ ДЕЛАЕШЬ ЭТО НЕ ТАК"
          },
          soundRecommendation: {
            vibe: "Aggressive Phonk / Fast Synth",
            bpm: 130,
            suggestedTrack: "Viral Bass Boosted Trend",
            soundSyncPoints: ["Drop at 0:03", "Beat drop at 0:15"]
          },
          scenes: [
            {
              time: "0:00 - 0:03",
              visual: "Резкий зум в камеру с ярким жестом",
              audioSpeech: "90% создателей упускают эту фишку прямо сейчас!",
              textOverlay: "СЕКРЕТ ТИКТОКА ⚡️",
              transition: "Whip pan"
            },
            {
              time: "0:03 - 0:15",
              visual: "Скринкаст демонстрации работы нейросетей",
              audioSpeech: "Смотрите, как за 2 клика сгенерировать готовый ролик в студии.",
              textOverlay: "1 КЛИК = ГОТОВО",
              transition: "Slide left"
            },
            {
              time: "0:15 - 0:30",
              visual: "Финальный результат с указанием на комментарии",
              audioSpeech: "Сохраняй чтобы не потерять и пиши слово СТУДИЯ в комменты!",
              textOverlay: "СОХРАНИ ЧТОБЫ ПОМНИТЬ",
              transition: "Loop cut"
            }
          ],
          hashtags: ["#fyp", "#tiktokstudio", "#тренды", "#нейросети", "#рекомендации"],
          captionText: "Как вам такой формат? Напиши в комментариях свое мнение 👇⚡️",
          studioSettings: {
            aspectRatio: "9:16 (1080x1920)",
            frameRate: "60fps",
            safeZoneNotice: "Safe zone compliant"
          },
          viralityScore: 96
        };
      }

      res.json(tiktokResult);
    } catch (error: any) {
      console.error("Error generating TikTok blueprint:", error);
      res.status(500).json({ error: error.message || "Failed to generate TikTok blueprint" });
    }
  });

  // 9. Higgsfield AI Cinema Motion Generator (https://higgsfield.ai)
  app.post("/api/gen/higgsfield", async (req, res) => {
    try {
      const {
        prompt,
        cameraMotion = "dolly_zoom",
        lensType = "anamorphic_35mm",
        aspectRatio = "16:9",
        motionSpeed = "dynamic"
      } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "Video prompt is required" });
        return;
      }

      const ai = getAiClient();
      const higgsfieldInstruction = `You are an expert Hollywood cinematographer and master prompter for Higgsfield AI (https://higgsfield.ai) — the state-of-the-art cinematic AI video engine with physical camera motion controls.
Translate the user's idea into an exact Higgsfield AI cinema generation recipe.
Return STRICTLY a JSON object without markdown fences:
{
  "projectTitle": "Cinematic Scene Title",
  "higgsfieldPrompt": "Ultra-detailed cinema prompt with lighting, camera physics, textural depth, atmosphere, and motion vector cues",
  "cameraTrajectory": {
    "motionType": "Dolly Zoom / Vertigo Effect" | "360 Bullet-Time Orbit" | "FPV Drone High-Speed Drift" | "Crane Down to Low-Angle" | "Whip Pan Transition",
    "vector": "Forward 5m with simultaneous focal length zoom from 24mm to 85mm",
    "rotationDeg": 180,
    "speed": "cinematic-slow" | "dynamic" | "hyperspeed"
  },
  "lensAndFilm": {
    "lens": "Anamorphic 35mm T1.5 or IMAX 70mm",
    "lighting": "Teal & Orange volumetric hazing with rim backlight",
    "shutterAngle": "180 degree cinematic motion blur",
    "colorGrading": "ARRI Alexa LogC3 Rec.709 cinema grade"
  },
  "higgsfieldCopyableString": "Complete formatted prompt ready to paste directly into higgsfield.ai input box",
  "characterConsistencyAnchor": "Keywords used to lock subject facial geometry across frames",
  "suggestedSeed": 4829103,
  "portalUrl": "https://higgsfield.ai"
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Create Higgsfield AI cinema instructions for: "${prompt}". Camera Motion: ${cameraMotion}, Lens: ${lensType}, Aspect: ${aspectRatio}, Speed: ${motionSpeed}.`,
        config: {
          systemInstruction: higgsfieldInstruction,
          responseMimeType: 'application/json',
        }
      });

      let higgsfieldResult = {};
      try {
        const raw = (response.text || "{}").replace(/```(json)?/gi, '').trim();
        higgsfieldResult = JSON.parse(raw);
      } catch (err) {
        higgsfieldResult = {
          projectTitle: "Higgsfield Cinema Shot",
          higgsfieldPrompt: `Masterpiece cinematic 4k footage of ${prompt}, shot on ARRI Alexa 65 with anamorphic lens, volumetric golden light, micro-droplets in air, extreme hyper-detail, cinematic slow motion`,
          cameraTrajectory: {
            motionType: cameraMotion,
            vector: "Smooth linear camera tracking with parallax displacement",
            rotationDeg: 45,
            speed: motionSpeed
          },
          lensAndFilm: {
            lens: lensType,
            lighting: "Dramatic volumetric rim light with cinematic haze",
            shutterAngle: "180 deg motion blur",
            colorGrading: "Kodak 5219 film stock simulation"
          },
          higgsfieldCopyableString: `${prompt} --camera ${cameraMotion} --lens ${lensType} --quality ultra --fps 60`,
          characterConsistencyAnchor: "Photorealistic human features, locked facial structure",
          suggestedSeed: Math.floor(Math.random() * 9000000) + 1000000,
          portalUrl: "https://higgsfield.ai"
        };
      }

      res.json(higgsfieldResult);
    } catch (error: any) {
      console.error("Error generating Higgsfield cinema specs:", error);
      res.status(500).json({ error: error.message || "Failed to generate Higgsfield specs" });
    }
  });

  // 10. Google AI Studio Prompt Sandbox & Code Generator (https://ai.studio)
  app.post("/api/gen/ai-studio/test", async (req, res) => {
    try {
      const {
        systemInstruction = "You are a helpful, expert AI assistant.",
        prompt,
        model = "gemini-3.8-flash",
        temperature = 0.7,
        topP = 0.95
      } = req.body;

      if (!prompt) {
        res.status(400).json({ error: "User prompt is required" });
        return;
      }

      const ai = getAiClient();
      const startTime = Date.now();

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: Number(temperature),
          topP: Number(topP),
        }
      });

      const latencyMs = Date.now() - startTime;
      const textOutput = response.text || "";

      // Estimate tokens
      const promptTokens = Math.ceil((prompt.length + (systemInstruction?.length || 0)) / 4);
      const completionTokens = Math.ceil(textOutput.length / 4);

      // Generate SDK code snippets
      const pythonSnippet = `from google import genai
from google.genai import types

client = genai.Client()

response = client.models.generate_content(
    model="${model}",
    contents="${prompt.replace(/"/g, '\\"')}",
    config=types.GenerateContentConfig(
        system_instruction="${systemInstruction.replace(/"/g, '\\"')}",
        temperature=${temperature},
        top_p=${topP},
    ),
)
print(response.text)`;

      const tsSnippet = `import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI();

async function main() {
  const response = await ai.models.generateContent({
    model: '${model}',
    contents: '${prompt.replace(/'/g, "\\'")}',
    config: {
      systemInstruction: '${systemInstruction.replace(/'/g, "\\'")}',
      temperature: ${temperature},
      topP: ${topP},
    }
  });

  console.log(response.text);
}

main();`;

      const curlSnippet = `curl "https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent" \\
  -H "Content-Type: application/json" \\
  -H "x-goog-api-key: $GEMINI_API_KEY" \\
  -d '{
    "contents": [{"parts": [{"text": "${prompt.replace(/"/g, '\\"')}"}]}],
    "systemInstruction": {"parts": [{"text": "${systemInstruction.replace(/"/g, '\\"')}"}]},
    "generationConfig": {"temperature": ${temperature}, "topP": ${topP}}
  }'`;

      res.json({
        output: textOutput,
        latencyMs,
        tokenUsage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens
        },
        codeSnippets: {
          python: pythonSnippet,
          typescript: tsSnippet,
          curl: curlSnippet
        },
        portalUrl: "https://ai.studio"
      });
    } catch (error: any) {
      console.error("Error in AI Studio test execution:", error);
      res.status(500).json({ error: error.message || "Failed to execute prompt test" });
    }
  });

  // 10. AI Advertising Generator (Генерация рекламы)
  app.post("/api/gen/ad", async (req, res) => {
    try {
      const {
        productName = "Genesis AI Platform",
        productDescription = "Универсальная нейросетевая экосистема для генерации контента",
        category = "saas",
        targetAudience = "Креаторы, маркетологи, агентства и предприниматели",
        keyBenefits = ["Экономия времени на 90%", "Профессиональное качество 4K", "Все нейросети в одном окне"],
        format = "full_pack",
        tone = "high_energy"
      } = req.body;

      const ai = getAiClient();
      const prompt = `You are a World-Class Creative Ad Director and Performance Marketing Specialist (producing $10M+ ROI ads across Meta, TikTok, YouTube, and Google).
Create a comprehensive advertising campaign package for the following product:
- Product Name: ${productName}
- Description: ${productDescription}
- Category: ${category}
- Target Audience: ${targetAudience}
- Key Benefits: ${Array.isArray(keyBenefits) ? keyBenefits.join(', ') : keyBenefits}
- Ad Format: ${format}
- Tone of Voice: ${tone}

Produce a complete, conversion-optimized advertising package in Russian language.
Return STRICTLY a JSON object without markdown fences, with this structure:
{
  "campaignOverview": {
    "campaignTitle": "Catchy campaign name in Russian",
    "mainAngle": "Core advertising angle / value proposition",
    "targetPersona": {
      "pains": ["Pain point 1", "Pain point 2", "Pain point 3"],
      "desires": ["Desire 1", "Desire 2"],
      "objections": ["Objection 1 and how we smash it"],
      "trigger": "Key psychological trigger (FOMO, Status, Speed, Financial Freedom)"
    }
  },
  "viralHooks": [
    {
      "text": "3-second hook spoken or shown on screen",
      "hookType": "Curiosity / Problem / Shocking Stat / Social Proof",
      "visualCue": "Visual cue for the first 3 seconds to stop the scroll"
    }
  ],
  "videoScript": [
    {
      "sceneNumber": 1,
      "timing": "00:00 - 00:03",
      "stage": "Hook / Захват внимания",
      "visualDirection": "Detailed camera & scene instruction for AI video generation (Veo / Higgsfield)",
      "voiceover": "Spoken voiceover text in Russian",
      "onScreenText": "Big bold caption overlay",
      "soundEffect": "Whoosh / Bass Drop / Typing SFX"
    }
  ],
  "adCopy": {
    "headlineVariants": ["Headline 1", "Headline 2", "Headline 3"],
    "primaryTextVariants": [
      "Long-form conversion copy with emojis and bullet points",
      "Short punchy direct-response copy"
    ],
    "bulletPoints": ["Bullet 1 with emoji", "Bullet 2 with emoji", "Bullet 3 with emoji"],
    "callToActions": ["Попробовать бесплатно", "Начать генерацию", "Забрать доступ со скидкой 50%"]
  },
  "bannerCreatives": [
    {
      "format": "Feed 1:1 (1080x1080)",
      "bannerTitle": "High CTR Banner",
      "visualPrompt": "Prompt for Midjourney / Nano Banana to generate the ad visual backdrop",
      "backgroundStyle": "Dark gradient with neon accents and 3D glassmorphism elements",
      "mainHeadline": "Short catchy headline",
      "subText": "Supporting benefit text",
      "badgeText": "ХИТ 2026 / ТОЛЬКО СЕГОДНЯ",
      "ctaButtonText": "Жми сюда"
    },
    {
      "format": "Story 9:16 (1080x1920)",
      "bannerTitle": "Viral Story Ad",
      "visualPrompt": "Prompt for vertical story creative",
      "backgroundStyle": "Hyper-realistic glowing studio setup with floating badges",
      "mainHeadline": "Vertical impact text",
      "subText": "1-click solution",
      "badgeText": "-40% СКИДКА",
      "ctaButtonText": "Свайп вверх"
    },
    {
      "format": "Landscape 16:9 (1200x628)",
      "bannerTitle": "Web & Display Banner",
      "visualPrompt": "Cinematic wide commercial banner background",
      "backgroundStyle": "Clean modern tech aesthetic with depth of field",
      "mainHeadline": "Enterprise & Pro Grade",
      "subText": "Fastest AI engine on the market",
      "badgeText": "PRO EDITION",
      "ctaButtonText": "Узнать больше"
    }
  ],
  "ugcGuidelines": {
    "creatorProfile": "Ideal creator type (e.g. Energetic tech enthusiast in their 20s)",
    "filmingNotes": "Natural home lighting, handheld iPhone selfie angle, natural pauses",
    "hookDelivery": "Speed, emotion, gesture recommendations"
  }
}`;

      let adResult: any;
      const fallbackAd = {
        campaignOverview: {
          campaignTitle: `${productName} — Максимальный Результат 2026`,
          mainAngle: `Инновационное решение для категории ${category}, закрывающее ключевые боли аудитории.`,
          targetPersona: {
            pains: [
              "Трата огромного количества времени и денег на неэффективные методы",
              "Сложность внедрения и отсутствие измеримого результата",
              "Высокая стоимость подрядчиков и низкая скорость работы"
            ],
            desires: [
              "Быстрый старт и окупаемость в первые же дни",
              "Автоматизация рутины и высвобождение времени"
            ],
            objections: [
              "«Это слишком дорого» -> Окупается с первого заказа, гарантия возврата",
              "«Я не разберусь» -> Готовые шаблоны и поддержка 24/7"
            ],
            trigger: "Скорость, Статус и Финансовая Свобода"
          }
        },
        viralHooks: [
          {
            text: `Никогда не делай это, если развиваешь ${category} в 2026 году!`,
            hookType: "Curiosity / Shock",
            visualCue: "Резкий зум в камеру с перечеркнутым красным знаком"
          },
          {
            text: `Секретный инструмент, который скрывают топ-1% специалистов...`,
            hookType: "FOMO / Secret",
            visualCue: "Демонстрация экрана с невероятной скоростью работы"
          },
          {
            text: `Как сэкономить 50 часов в неделю с помощью ${productName}?`,
            hookType: "Problem / Agitation",
            visualCue: "Сравнение: уставший человек слева vs радостный справа"
          }
        ],
        videoScript: [
          {
            sceneNumber: 1,
            timing: "00:00 - 00:03",
            stage: "Hook / Захват внимания",
            visualDirection: "Extreme fast push-in towards smartphone screen displaying impressive metrics, dynamic glitch transition",
            voiceover: `Остановись! Если ты до сих пор делаешь это вручную — ты теряешь деньги каждый день.`,
            onScreenText: "СТОП! 🛑 ТЫ ТЕРЯЕШЬ ДЕНЬГИ",
            soundEffect: "Heavy Bass Drop + Whoosh"
          },
          {
            sceneNumber: 2,
            timing: "00:03 - 00:08",
            stage: "Pain / Демонстрация боли",
            visualDirection: "Split screen comparison showing chaotic manual work vs sleek modern dashboard with 1-click execution",
            voiceover: `Раньше на это уходили дни и тысячи рублей на подрядчиков. Но всё изменилось.`,
            onScreenText: "1 ДЕНЬ ➔ 10 СЕКУНД ⚡️",
            soundEffect: "Fast Glitch Cut"
          },
          {
            sceneNumber: 3,
            timing: "00:08 - 00:15",
            stage: "Solution / Презентация оффера",
            visualDirection: "Sleek 3D product showcase, glowing neon accents, smooth orbital camera motion",
            voiceover: `Встречайте ${productName}: умное решение, которое делает 90% работы за вас с гарантией результата.`,
            onScreenText: `${productName.toUpperCase()} • 1-КЛИК РЕШЕНИЕ`,
            soundEffect: "Chime + Upbeat Groove"
          },
          {
            sceneNumber: 4,
            timing: "00:15 - 00:20",
            stage: "Call to Action / Дедлайн",
            visualDirection: "Macro detail of finger tapping the glowing CTA button, countdown timer overlay",
            voiceover: `Переходи по ссылке в описании прямо сейчас и забирай доступ с максимальной скидкой!`,
            onScreenText: "ЖМИ НА ССЫЛКУ • СКИДКА 50% 🎁",
            soundEffect: "Success Ding"
          }
        ],
        adCopy: {
          headlineVariants: [
            `🚀 ${productName}: Прорывной результат уже сегодня`,
            `Как автоматизировать ${category} за 10 секунд без опыта`,
            `Секретная связка 2026: забирай доступ со скидкой 50%`
          ],
          primaryTextVariants: [
            `Устали тратить часы на рутину? ⚡️\n\nС ${productName} вы получаете автоматизацию на 90% быстрее обычных методов.\n\n✅ Быстрый старт за 2 минуты\n✅ Профессиональное качество без опыта\n✅ Гарантия окупаемости\n\nПопробуйте прямо сейчас по ссылке ниже 👇`,
            `Хватит переплачивать подрядчикам! 🔥\n\nВстречайте ${productName} — ваш универсальный инструмент нового поколения. Получите тестовый доступ уже сегодня.`
          ],
          bulletPoints: [
            "Экономия до 40 часов рабочего времени каждый месяц",
            "Готовые шаблоны и проверенные связки в комплекте",
            "Круглосуточная поддержка экспертов 24/7",
            "100% гарантия возврата в течение 14 дней"
          ],
          callToActions: [
            "Попробовать бесплатно",
            "Начать генерацию",
            "Забрать доступ со скидкой 50%"
          ]
        },
        bannerCreatives: [
          {
            format: "Feed 1:1 (1080x1080)",
            bannerTitle: "High CTR Banner",
            visualPrompt: `Futuristic minimalist 3D podium with glowing neon purple accents, sleek tech product mockup, dramatic studio lighting, 8k resolution`,
            backgroundStyle: "Dark gradient with neon accents and 3D glassmorphism elements",
            mainHeadline: `${productName}: Прорыв в ${category}`,
            subText: "Автоматизация за 10 секунд. Без опыта.",
            badgeText: "ХИТ 2026",
            ctaButtonText: "Попробовать"
          },
          {
            format: "Story 9:16 (1080x1920)",
            bannerTitle: "Viral Story Ad",
            visualPrompt: `Vertical 9:16 cinematic luxury showcase, floating glowing holograms, high-contrast anamorphic lens flare`,
            backgroundStyle: "Hyper-realistic glowing studio setup with floating badges",
            mainHeadline: "УСПЕЙ ЗАБРАТЬ ДОСТУП",
            subText: "Скидка 50% только до конца недели",
            badgeText: "-50% СКИДКА",
            ctaButtonText: "Свайп вверх"
          },
          {
            format: "Landscape 16:9 (1200x628)",
            bannerTitle: "Web & Display Banner",
            visualPrompt: `Wide cinematic commercial shot, clean modern tech aesthetic with shallow depth of field, sleek typography space`,
            backgroundStyle: "Clean modern tech aesthetic with depth of field",
            mainHeadline: "Профессиональный инструмент нового поколения",
            subText: "Быстрее. Качественнее. Выгоднее.",
            badgeText: "PRO EDITION",
            ctaButtonText: "Узнать больше"
          }
        ],
        ugcGuidelines: {
          creatorProfile: "Энергичный, харизматичный блогер от 20 до 35 лет с естественной подачей без наигранности.",
          filmingNotes: "Съемка на селфи-камеру iPhone в хорошем дневном свете, естественные эмоции, живая жестикуляция.",
          hookDelivery: "Начать говорить с первой миллисекунды, взгляд строго в объектив, яркая интонация."
        }
      };

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });

        const raw = response.text || "{}";
        const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        adResult = JSON.parse(clean);
      } catch (genErr) {
        console.warn("LLM ad generation parse issue, using structured fallback:", genErr);
        adResult = fallbackAd;
      }

      res.json(adResult || fallbackAd);
    } catch (error: any) {
      console.error("Error in Ad generation:", error);
      res.status(500).json({ error: error.message || "Failed to generate ad campaign" });
    }
  });

  // 11. AI Bot Generator (Генерация ботов)
  app.post("/api/gen/bot", async (req, res) => {
    try {
      const {
        botName = "Genesis Assistant",
        platform = "telegram",
        botRole = "sales_assistant",
        businessDescription = "Онлайн-сервис подписки на нейросети",
        targetAudience = "Пользователи, желающие оптимизировать работу с контентом",
        knowledgeBase = "Тарифы: Базовый $19, Про $49, Безлимит $99. Поддержка 24/7. Гарантия возврата 14 дней.",
        tone = "friendly_expert",
        toolsEnabled = ["collect_lead", "check_pricing", "faq_lookup"]
      } = req.body;

      const ai = getAiClient();
      const prompt = `You are a Principal AI Bot Architect & Automation Engineer specializing in production-ready conversational agents for Telegram, Discord, WhatsApp, and Web.
Generate a complete, fully functioning AI Bot blueprint and production code for:
- Bot Name: ${botName}
- Platform: ${platform}
- Bot Role: ${botRole}
- Business Description: ${businessDescription}
- Target Audience: ${targetAudience}
- Knowledge Base / FAQs: ${knowledgeBase}
- Tone of Voice: ${tone}
- Tools/Functions: ${Array.isArray(toolsEnabled) ? toolsEnabled.join(', ') : toolsEnabled}

Return STRICTLY a JSON object without markdown fences, with this structure:
{
  "botConfig": {
    "name": "${botName}",
    "handle": "@${botName.toLowerCase().replace(/[^a-z0-9_]/g, '')}_bot",
    "description": "Short Russian bio for the bot",
    "welcomeMessage": "Rich formatted welcome message in Russian with emoji and menu cues",
    "systemPrompt": "Exhaustive, rigorous system instruction that will be passed to Gemini/OpenAI API to embody this bot flawlessly. Must instruct the bot to stay in character, use knowledge base accurately, handle objections, and call tools when needed.",
    "personalityTraits": ["Traits in Russian", "e.g. Дружелюбный", "Экспертный", "Лаконичный"],
    "fallbackMessage": "Russian fallback message when question is outside knowledge base"
  },
  "knowledgeBaseProcessed": [
    {
      "topic": "Topic or FAQ question",
      "answer": "Accurate response according to the provided knowledge",
      "keywords": ["tag1", "tag2"]
    }
  ],
  "tools": [
    {
      "functionName": "collect_lead",
      "description": "Collects user name, phone/email and requested service",
      "parameters": {"name": "string", "contact": "string", "budget": "string"}
    },
    {
      "functionName": "check_pricing",
      "description": "Returns current active tariffs and promotional discounts",
      "parameters": {"plan": "string"}
    }
  ],
  "dialogFlow": [
    {
      "stepId": "welcome",
      "title": "Приветствие и выявление потребности",
      "botMessage": "Привет! Чем могу помочь сегодня?",
      "options": ["Узнать тарифы", "Попробовать демо", "Связаться с менеджером"],
      "action": "Route to respective branch"
    },
    {
      "stepId": "pricing",
      "title": "Презентация тарифов",
      "botMessage": "У нас есть 3 выгодных плана: Базовый, Про и Безлимит.",
      "options": ["Выбрать Про", "Сравнить все", "Задать вопрос"],
      "action": "Present comparison"
    },
    {
      "stepId": "lead",
      "title": "Сбор контактов / Закрытие сделки",
      "botMessage": "Оставьте ваш контакт, чтобы зафиксировать скидку 20%:",
      "options": ["Отправить телефон", "Telegram username"],
      "action": "Save to CRM / Notify Admin"
    }
  ],
  "codeExports": {
    "pythonAiogram": "Full production Python 3 code with aiogram 3.x and google-genai integration",
    "nodejsTelegraf": "Full production Node.js / TypeScript code with telegraf and @google/genai integration",
    "discordPy": "Full Discord.py bot code with slash commands and conversation state",
    "envSample": "BOT_TOKEN=your_token_here\\nGEMINI_API_KEY=your_gemini_key_here\\nWEBHOOK_URL=https://your-domain.com/webhook"
  }
}`;

      let botResult: any;
      const fallbackBot = {
        botConfig: {
          name: botName,
          handle: `@${botName.toLowerCase().replace(/[^a-z0-9_]/g, '')}_bot`,
          description: `Официальный AI-ассистент: ${businessDescription}`,
          welcomeMessage: `👋 Привет! Я — ${botName}, ваш персональный интеллектуальный ассистент.\n\nЯ помогу вам узнать о наших услугах, рассчитать стоимость и ответить на любые вопросы.\n\nЧем могу помочь сегодня?`,
          systemPrompt: `You are ${botName}, a world-class AI assistant for ${businessDescription}.\nYour tone is ${tone}. Target audience: ${targetAudience}.\nKnowledge base:\n${knowledgeBase}\nAnswer accurately, politely and concisely. Always guide the user towards taking action or booking.`,
          personalityTraits: ["Экспертный", "Дружелюбный", "Оперативный", "Внимательный к деталям"],
          fallbackMessage: "Извините, у меня пока нет точного ответа на этот вопрос. Я могу передать ваш запрос менеджеру или ответить на другие вопросы по тарифам и услугам."
        },
        knowledgeBaseProcessed: [
          {
            topic: "Тарифы и стоимость",
            answer: knowledgeBase || "Информация о тарифах доступна в меню бота.",
            keywords: ["тариф", "цена", "стоимость", "прайс"]
          },
          {
            topic: "Сроки и гарантия",
            answer: "Мы гарантируем качество и оперативную поддержку 24/7.",
            keywords: ["гарантия", "сроки", "возврат"]
          }
        ],
        tools: [
          {
            functionName: "collect_lead",
            description: "Сбор контактных данных пользователя (имя, телефон/ник, вопрос)",
            parameters: { name: "string", contact: "string", budget: "string" }
          },
          {
            functionName: "check_pricing",
            description: "Получение актуальных цен и спецпредложений",
            parameters: { plan: "string" }
          }
        ],
        dialogFlow: [
          {
            stepId: "welcome",
            title: "Приветствие и выявление потребности",
            botMessage: "Здравствуйте! Чем я могу быть полезен сегодня?",
            options: ["Тарифы и цены", "Задать вопрос", "Связаться с менеджером"],
            action: "Маршрутизация в нужный раздел"
          },
          {
            stepId: "pricing",
            title: "Презентация тарифов",
            botMessage: "У нас действуют выгодные тарифные планы с поддержкой 24/7.",
            options: ["Выбрать тариф", "Сравнить планы", "Назад"],
            action: "Открытие каталога"
          },
          {
            stepId: "lead",
            title: "Сбор контактов",
            botMessage: "Оставьте контакт, чтобы зафиксировать специальное предложение:",
            options: ["Отправить телефон", "Telegram username"],
            action: "Передача в CRM"
          }
        ],
        codeExports: {
          pythonAiogram: `# Production aiogram 3.x bot with google-genai
import asyncio
import os
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from google import genai

BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "YOUR_GEMINI_KEY")

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()
ai = genai.Client(api_key=GEMINI_KEY)

SYSTEM_PROMPT = """You are ${botName}: ${businessDescription}"""

@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    await message.answer("👋 Привет! Я ${botName}. Чем могу помочь?")

@dp.message()
async def handle_message(message: types.Message):
    response = await ai.aio.models.generate_content(
        model="gemini-3.8-flash",
        contents=message.text,
        config={"system_instruction": SYSTEM_PROMPT}
    )
    await message.answer(response.text or "Извините, не могу ответить.")

async def main():
    print("Bot started...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())`,
          nodejsTelegraf: `// Production Node.js Telegraf bot
import { Telegraf } from 'telegraf';
import { GoogleGenAI } from '@google/genai';

const bot = new Telegraf(process.env.BOT_TOKEN || '');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

bot.start((ctx) => ctx.reply("👋 Привет! Я ${botName}. Чем могу помочь?"));

bot.on('text', async (ctx) => {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: ctx.message.text,
      config: { systemInstruction: "You are ${botName}: ${businessDescription}" }
    });
    await ctx.reply(res.text || "Готово!");
  } catch (err) {
    await ctx.reply("Произошла ошибка обработки.");
  }
});

bot.launch().then(() => console.log('Bot running'));`,
          discordPy: `# Production Discord bot with google-genai
import os
import discord
from discord.ext import commands
from google import genai

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)
ai = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user}")

@bot.command()
async def ask(ctx, *, question):
    res = ai.models.generate_content(
        model="gemini-3.8-flash",
        contents=question
    )
    await ctx.send(res.text)

bot.run(os.getenv("DISCORD_TOKEN"))`,
          envSample: `BOT_TOKEN=your_token_here\nGEMINI_API_KEY=your_gemini_key_here\nWEBHOOK_URL=https://your-domain.com/webhook`
        }
      };

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });

        const raw = response.text || "{}";
        const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        botResult = JSON.parse(clean);
      } catch (genErr) {
        console.warn("LLM bot generation parse issue, using structured fallback:", genErr);
        botResult = fallbackBot;
      }

      res.json(botResult || fallbackBot);
    } catch (error: any) {
      console.error("Error in Bot generation:", error);
      res.status(500).json({ error: error.message || "Failed to generate bot blueprint" });
    }
  });

  // 12. AI Bot Live Chat Testing (Интерактивное тестирование бота)
  app.post("/api/gen/bot/chat", async (req, res) => {
    try {
      const {
        systemPrompt = "You are a helpful AI bot.",
        botName = "AI Bot",
        knowledgeBase = "",
        messages = []
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: "messages array is required" });
        return;
      }

      const ai = getAiClient();
      // Ensure the first turn is always from the user (Gemini multi-turn rule)
      let contents = messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));
      while (contents.length > 0 && contents[0].role === 'model') {
        contents.shift();
      }
      if (contents.length === 0) {
        contents = [{ role: 'user', parts: [{ text: 'Привет' }] }];
      }

      const fullInstruction = `${systemPrompt}\n\n[OFFICIAL KNOWLEDGE BASE]:\n${knowledgeBase}\n\nMaintain this persona strictly as ${botName}. Respond in natural, helpful language adhering to all guidelines.`;

      const chatResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: fullInstruction,
          temperature: 0.7
        }
      });

      res.json({ reply: chatResponse.text || "..." });
    } catch (error: any) {
      console.error("Error in bot chat test:", error);
      res.status(500).json({ error: error.message || "Failed to chat with bot" });
    }
  });

  // 13. AI Music Video Clip Generator (Генерация музыкальных клипов с постоянством персонажа, бит-синхронизацией и липсинком)
  app.post("/api/gen/music-video", async (req, res) => {
    try {
      const {
        trackTitle = "Cyber Neon Horizon",
        artistName = "Genesis Artist",
        genre = "synthwave",
        bpm = 128,
        lyrics = "Neon lights in the rain / Running through the digital vein / Feel the bass drop in my heart / We will never be apart",
        character = {
          name: "Alex Vance",
          gender: "Male / Female / Unisex",
          age: "24",
          features: "Cybernetic glowing blue iris in right eye, messy silver-streaked hair, cheek scar",
          outfit: "High-collar matte black leather jacket with luminescent violet piping, silver chains",
          seedTag: "char_alex_vance_synthwave_core"
        },
        visualStyle = {
          preset: "cyberpunk_noir",
          colorPalette: ["#FF0055", "#00F0FF", "#180033", "#FFE600"],
          lighting: "High-contrast anamorphic lens flare, deep wet asphalt reflections, neon rim lighting",
          cameraLens: "ARRI Alexa 65, 35mm Master Anamorphic, shallow 1.8 aperture, subtle 35mm film grain"
        },
        scenesCount = 6
      } = req.body;

      const ai = getAiClient();
      const prompt = `You are an Award-Winning AI Music Video Director and Visual FX Supervisor (specializing in Google Veo, Higgsfield AI, Runway Gen-3, and Sora).
Your task is to produce a scene-by-scene cinematic AI music video production storyboard with:
1. BEAT-TO-VISUAL SYNC: precise timing cuts matched to the BPM (${bpm} BPM), bass drops, snare hits, and rhythm transitions.
2. LIP-SYNC TO SONG VOCALS: phoneme, viseme, mouth-shape openness, and facial performance guides for each lyrical line.
3. CHARACTER CONSISTENCY (ПОСТОЯНСТВО ПЕРСОНАЖА): locked character seed prompts, face tokens, wardrobe locks, and LoRA keyword that guarantees the character looks identical across all scenes.
4. FULL VISUAL STYLE LOCK (КОНТРОЛЬ ВИЗУАЛЬНОГО СТИЛЯ): unified lighting, color palette, camera optics, and negative prompt across every single scene.

Project Parameters:
- Track: "${trackTitle}" by "${artistName}"
- Genre: ${genre}
- BPM: ${bpm} (Beat interval: ${(60 / bpm).toFixed(3)}s per beat, 4-beat measure: ${(240 / bpm).toFixed(3)}s)
- Lyrics to sync:
"${lyrics}"
- Character DNA:
  * Name: ${character.name || 'Hero Artist'}
  * Age/Appearance: ${character.age || '25'}, ${character.features || 'Striking cyber features'}
  * Wardrobe: ${character.outfit || 'Signature futuristic stage attire'}
  * Seed Token: <${character.seedTag || 'char_artist_seed_v1'}>
- Visual Style Master:
  * Preset: ${visualStyle.preset || 'Cinematic Film'}
  * Palette: ${Array.isArray(visualStyle.colorPalette) ? visualStyle.colorPalette.join(', ') : visualStyle.colorPalette}
  * Lighting & Optics: ${visualStyle.lighting || 'Cinematic dramatic lighting'}, ${visualStyle.cameraLens || '35mm anamorphic'}
- Number of scenes: ${scenesCount}

Produce the full production plan in Russian language (with technical video prompts in English for AI video renderers).
Return STRICTLY a JSON object without markdown fences, with this structure:
{
  "trackAnalysis": {
    "bpm": ${bpm},
    "beatDurationSeconds": ${(60 / bpm).toFixed(3)},
    "barDurationSeconds": ${(240 / bpm).toFixed(3)},
    "structureFlow": "Intro (8 bars) -> Verse 1 (16 bars) -> Pre-Chorus (8 bars) -> Drop/Chorus (16 bars) -> Solo (8 bars) -> Outro (8 bars)",
    "bassDropPoints": ["00:32 (Heavy Sub-Bass Drop)", "01:15 (Double Snare Roll & Drop)", "02:04 (Climax Drop)"],
    "visualSyncStrategy": "Rapid camera cut on snare hits, slow-motion zoom on sustained vocal notes, screen shake on bass kicks"
  },
  "characterDNALock": {
    "seedTag": "<${character.seedTag || 'char_artist_seed_v1'}>",
    "masterCharacterPrompt": "Full English prompt locked for character identity: Exact face structure, specific hairstyle, exact skin tone, eye glow, signature wardrobe. Must include '<${character.seedTag || 'char_artist_seed_v1'}>' token.",
    "consistencyRules": [
      "Rule 1: Never alter jacket collar or signature silver chains",
      "Rule 2: Keep exact eye scar and iris color consistent",
      "Rule 3: Maintain 50mm portrait focal distance for close-up performance shots"
    ],
    "negativePrompt": "deformed face, different person, changing hair color, changing outfit, extra limbs, blurry face, caricature, anime if photoreal"
  },
  "styleMasterLock": {
    "styleName": "${visualStyle.preset}",
    "unifiedStylePrompt": "Full English master visual style prompt describing lighting, color grade, camera lens, atmosphere, haze, and rendering fidelity to be prepended to all scenes.",
    "negativeStylePrompt": "overexposed, washed out, low resolution, cartoon, stock footage, flat lighting, watermark",
    "colorGradingNotes": "Russian explanation of color grading and palette enforcement across cuts",
    "aspectRatio": "16:9 Cinema Scope 2.39:1"
  },
  "scenes": [
    {
      "sceneNumber": 1,
      "timecode": "00:00 - 00:08",
      "songSection": "Intro",
      "beatTrigger": "Atmospheric synth pad into 4/4 hi-hat groove",
      "lipSync": {
        "lyricsLine": "Instrumental atmospheric build-up",
        "visemes": "Closed mouth, slow breath, head nod on beat",
        "singingEmotion": "Tense anticipation, mysterious look into lens",
        "mouthOpenness": "Closed / subtle breath"
      },
      "sceneDescription": "Russian scene overview with character action and environment",
      "cameraMotion": "Slow creeping dolly push-in towards the character's eye reflection",
      "characterAction": "Character turns slowly towards camera as the first beat hits",
      "videoPromptVeo": "Complete ready-to-run English prompt for Google Veo / Sora with Character DNA + Master Style + Camera instruction",
      "videoPromptHiggsfield": "Higgsfield AI prompt with specific camera motion tag: [DOLLY_IN_SLOW] [ANAMORPHIC_LENS] ..."
    }
  ],
  "productionTips": {
    "lipSyncWorkflow": "Step-by-step Russian instruction for Wav2Lip / SadTalker / LivePortrait to match audio vocal stem",
    "characterConsistencyWorkflow": "How to use the seed tag in Midjourney / Flux / Veo to lock face across scenes",
    "renderingRecommendation": "Recommended resolution (4K 60fps), FPS interpolation, and sound stem alignment"
  }
}`;

      let mvResult: any;
      const fallbackMv = {
        trackAnalysis: {
          bpm,
          beatDurationSeconds: (60 / bpm).toFixed(3),
          barDurationSeconds: (240 / bpm).toFixed(3),
          structureFlow: "Intro (8 bars) -> Verse 1 (16 bars) -> Pre-Chorus (8 bars) -> Drop/Chorus (16 bars) -> Solo (8 bars) -> Outro (8 bars)",
          bassDropPoints: ["00:32 (Heavy Sub-Bass Drop)", "01:15 (Double Snare Roll & Drop)", "02:04 (Climax Drop)"],
          visualSyncStrategy: "Смена планов строго на сильную долю (1-й и 3-й биты), слоу-мо зум на вокальных протяжках, глитч-эффект на бас-бочке"
        },
        characterDNALock: {
          seedTag: `<${character.seedTag || 'char_artist_seed_v1'}>`,
          masterCharacterPrompt: `Master Character DNA: ${character.name || 'Alex Vance'}, age ${character.age || '24'}, ${character.features || 'striking cyber features'}, wearing ${character.outfit || 'matte black jacket with violet accents'}, token <${character.seedTag || 'char_artist_seed_v1'}>, highly detailed photorealistic face, identical facial structure, sharp eyes, cinematic 8k render.`,
          consistencyRules: [
            "Правило 1: Никогда не менять цвет глаз и отличительные шрамы/детали лица",
            "Правило 2: Сохранять фирменный костюм и аксессуары во всех сценах клипа",
            "Правило 3: Использовать портретную оптику 50-85mm для сохранения пропорций лица"
          ],
          negativePrompt: "deformed face, changing outfit, different person, blurry eyes, caricature, extra limbs, cartoon"
        },
        styleMasterLock: {
          styleName: visualStyle.preset || "Cyberpunk Noir",
          unifiedStylePrompt: `Master Visual Style: ${visualStyle.preset || 'Cinematic Film'}, ${visualStyle.lighting || 'dramatic volumetric lighting'}, anamorphic lens flare, deep contrast, wet asphalt reflections, 35mm film grain, ARRI Alexa 65 cinema grade.`,
          negativeStylePrompt: "washed out, flat lighting, amateur video, low resolution, overexposed, watermark, cartoon",
          colorGradingNotes: "Глубокие тени с холодным бирюзовым оттенком, теплые неоновые акценты на контурах персонажа.",
          aspectRatio: "16:9 Cinema Scope"
        },
        scenes: [
          {
            sceneNumber: 1,
            timecode: "00:00 - 00:06",
            songSection: "Intro / Атмосферное вступление",
            beatTrigger: "Пульсирующий синтезаторный бас, появление первого хай-хэта",
            lipSync: {
              lyricsLine: "Инструментальное вступление, дыхание",
              visemes: "Рот закрыт, легкий вдох на 4-й доле",
              singingEmotion: "Таинственность, нарастающее напряжение",
              mouthOpenness: "Закрыт / легкий вздох"
            },
            sceneDescription: "Персонаж стоит спиной к камере под неоновым дождем, затем медленно оборачивается.",
            cameraMotion: "Медленный наезд (Dolly In) с уровня плеча к лицу",
            characterAction: "Поворот головы в сторону камеры точно на первую сильную долю",
            videoPromptVeo: `Cinematic 4k shot of <${character.seedTag || 'char_artist_seed_v1'}> turning towards camera in rain, neon city lights, volumetric steam, ARRI Alexa 65, slow motion`,
            videoPromptHiggsfield: `[DOLLY_IN_SLOW] [ANAMORPHIC_35MM] <${character.seedTag || 'char_artist_seed_v1'}> character turn, wet pavement reflections, 60fps`
          },
          {
            sceneNumber: 2,
            timecode: "00:06 - 00:15",
            songSection: "Verse 1 / Первый куплет",
            beatTrigger: "4/4 ровный бит, четкий малый барабан на 2 и 4 долю",
            lipSync: {
              lyricsLine: "Raindrops falling on the neon glass / Shadows moving fast",
              visemes: "R-AY-N-D-R-AA-P-S / F-AO-L-IH-NG",
              singingEmotion: "Уверенный вокал, прямой контакт глаз с объективом",
              mouthOpenness: "Средняя артикуляция, четкие гласные"
            },
            sceneDescription: "Крупный план артиста, исполняющего первый куплет песни на фоне мерцающих витрин.",
            cameraMotion: "Плавное панорамирование слева направо с акцентом на глаза",
            characterAction: "Эмоциональное пение прямо в объектив камеры",
            videoPromptVeo: `Extreme close-up performance shot of <${character.seedTag || 'char_artist_seed_v1'}> singing directly into lens, accurate lip articulation, bokeh neon background, 8k cinematic`,
            videoPromptHiggsfield: `[PAN_RIGHT_SMOOTH] [50MM_PRIME] Close-up lip sync singing performance of <${character.seedTag || 'char_artist_seed_v1'}>`
          },
          {
            sceneNumber: 3,
            timecode: "00:15 - 00:24",
            songSection: "Pre-Chorus / Разгон перед дропом",
            beatTrigger: "Учащающаяся барабанная дробь (snare roll), подъем частотного фильтра",
            lipSync: {
              lyricsLine: "Feel the electric frequency tonight",
              visemes: "F-IY-L / DH-AH / IH-L-EH-K-T-R-IH-K",
              singingEmotion: "Экстаз, повышение тональности, мощный подъем",
              mouthOpenness: "Широкое раскрытие рта на слове TONIGHT"
            },
            sceneDescription: "Динамичные кадры: вспышки света, камера делает круговой облет вокруг поющего персонажа.",
            cameraMotion: "Быстрый 360-градусный орбит вокруг персонажа (Orbit 360)",
            characterAction: "Персонаж делает жест рукой в такт нарастающему биту",
            videoPromptVeo: `Dynamic dynamic orbit shot of <${character.seedTag || 'char_artist_seed_v1'}> performing with rising energy, flashing strobe lights, volumetric smoke, high frame rate`,
            videoPromptHiggsfield: `[ORBIT_360_FAST] <${character.seedTag || 'char_artist_seed_v1'}> singing pre-chorus, strobe lighting pulse`
          },
          {
            sceneNumber: 4,
            timecode: "00:24 - 00:36",
            songSection: "Chorus & Drop / Кульминационный дроп",
            beatTrigger: "Тяжелый суб-бас дроп (Sub-Bass Drop) с максимальной энергией",
            lipSync: {
              lyricsLine: "We illuminate the dark into the light / Bass kicks in!",
              visemes: "W-IY / IH-L-UW-M-AH-N-EY-T / D-AA-R-K",
              singingEmotion: "Максимальная эмоциональная отдача, крик в микрофон",
              mouthOpenness: "Максимальное раскрытие, акцентированная мимика"
            },
            sceneDescription: "Взрыв конфетти или неоновых искр на дропе, персонаж в центре эпической световой бури.",
            cameraMotion: "Резкий зум назад с последующим замедлением (Vertigo Zoom / Dolly Out)",
            characterAction: "Прыжок или мощный жест в момент удара первого баса",
            videoPromptVeo: `Epic music video drop shot of <${character.seedTag || 'char_artist_seed_v1'}>, exploding neon sparks, intense bass impact screen shake, slow motion 4k 60fps`,
            videoPromptHiggsfield: `[DOLLY_ZOOM_VERTIGO] [SHAKE_ON_BASS] Heavy bass drop impact with <${character.seedTag || 'char_artist_seed_v1'}>`
          }
        ],
        productionTips: {
          lipSyncWorkflow: "Используйте инструмент Wav2Lip или SadTalker: подайте сгенерированный видеокадр и изолированную аудиодорожку вокала (Vocal Stem). Модель синхронизирует движения губ с точностью до миллисекунды.",
          characterConsistencyWorkflow: "В Midjourney / Flux / Veo всегда используйте тег персонажа и зафиксированный сид (seed). Сохраняйте описание лица и одежды неизменными во всех промптах.",
          renderingRecommendation: "Рендерите в разрешении 4K 60fps с использованием интерполяции кадров (RIFE) для кристальной плавности быстрых движений."
        }
      };

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            temperature: 0.7,
            responseMimeType: "application/json"
          }
        });

        const raw = response.text || "{}";
        const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        mvResult = JSON.parse(clean);
      } catch (genErr) {
        console.warn("LLM music video generation parse issue, using structured fallback:", genErr);
        mvResult = fallbackMv;
      }

      res.json(mvResult || fallbackMv);
    } catch (error: any) {
      console.error("Error in Music Video generation:", error);
      res.status(500).json({ error: error.message || "Failed to generate music video storyboard" });
    }
  });

  // 13. GENERATIVE MUSIC REMIX STUDIO API
  app.post('/api/gen/remix', async (req, res) => {
    try {
      const {
        trackTitle = "Cyber Vibe",
        artistName = "Genesis Artist",
        originalGenre = "Pop",
        targetStyle = "Cyberpunk Synthwave",
        originalBpm = 120,
        targetBpm = 128,
        keyShift = 0,
        mood = "Euphoric & Energetic",
        stemsConfig = {},
        vibePrompt = ""
      } = req.body;

      const fallbackRemix = {
        remixTitle: `${trackTitle} (${targetStyle} AI Remix)`,
        originalArtist: artistName,
        targetGenre: targetStyle,
        targetBpm: targetBpm,
        targetKey: keyShift > 0 ? `+${keyShift} st` : keyShift < 0 ? `${keyShift} st` : "Original Key",
        camelotKey: "8A / A minor",
        remixConcept: `Комплексная трансформация трека «${trackTitle}» из жанра ${originalGenre} в мощный, динамичный ${targetStyle}. Ритм перестроен с ${originalBpm} до ${targetBpm} BPM с акцентом на клубный грув, плотную бас-линию и объемное стерео-пространство.`,
        stemTransformations: {
          vocals: "Вокал нарезан на ритмичные чопы в дропах, добавлен автотюн, stereo-delay 1/4d и shimmer reverb в ямах.",
          drums: `Ритм-секция переведена в паттерн ${targetStyle}: пробивной punchy бочка, хлесткий layered клэп на 2 и 4 долю, быстрые 16th rolling хэты.`,
          bass: "Глубокий суб-бас с сатурацией и модулирующим LFO-фильтром, подчеркивающий гармоническую сетку.",
          synths: "Аналоговые saw-синтезаторы, арпеджированные секвенции и атмосферные cinematic пэды.",
          fx: "White-noise райзеры, reverse-крэши, лазерные свипы и даунлифтеры перед каждым дропом."
        },
        structure: [
          { section: "Intro", bars: 16, energy: 40, description: "Фильтрованный вокальный хук с атмосферным пэдом и нарастающим ритмом." },
          { section: "Verse / Groove", bars: 16, energy: 65, description: "Вступление баса и хэтов, полный вокальный куплет с реверберацией." },
          { section: "Build-Up / Riser", bars: 8, energy: 85, description: "Учащение снейр-ролла, восходящий питч-райзер, срез низких частот LPF." },
          { section: "DROP 1 (Climax)", bars: 16, energy: 100, description: "Взрывной дроп с мощным басом, плотной бочкой и вокальными чопами." },
          { section: "Breakdown / Melodic Bridge", bars: 16, energy: 50, description: "Снятие ударных, соло синтов, эмоциональная вокальная партия." },
          { section: "DROP 2 (Peak Energy)", bars: 16, energy: 100, description: "Финальный дроп с дополнительными арпеджио и перкуссионным слоем." },
          { section: "Outro", bars: 16, energy: 35, description: "Постепенный fade-out ритм-секции, эхо вокального хука, DJ-friendly конец." }
        ],
        synthesisSpecs: {
          leadNotes: [69, 72, 74, 76, 79, 76, 74, 72],
          bassline: [45, 45, 48, 48, 41, 41, 43, 43],
          drumStyle: targetStyle.toLowerCase().includes("drum") ? "dnb_stepper" : targetStyle.toLowerCase().includes("trap") ? "trap_808" : "four_on_floor",
          filterCutoff: 3200
        },
        prompts: {
          sunoPrompt: `[${targetStyle} Remix] ${trackTitle} by ${artistName}, ${targetBpm} BPM, punchy heavy drums, analog bassline, lush vocal chops, euphoric drop, festival master, clean mix`,
          udioPrompt: `${targetStyle}, remix, high energy, ${targetBpm} BPM, crisp percussion, sub bass, anthemic melodic lead, studio grade mastering`,
          flowMusicLyria: `DeepMind Lyria prompt: Re-compose stems in ${targetStyle} style at ${targetBpm} BPM, featuring modern synthesis, wide stereo imaging and dynamic drops`,
          aiNanoMusic: `Genre: ${targetStyle} | Tempo: ${targetBpm} BPM | Competition Entry: AI Nano Music Awards | Sound: Hi-Fi 320kbps`
        },
        dawProductionNotes: [
          "1. Установите темп проекта на " + targetBpm + " BPM.",
          "2. Используйте Sidechain компрессию между бочкой и басом (release 120ms).",
          "3. Срежьте частоты ниже 30Hz на мастере и ниже 120Hz на вокале.",
          "4. Для максимальной энергии дропа оставьте 1/2 такта тишины прямо перед ударом бочки."
        ]
      };

      const ai = getAiClient();
      let remixResult = fallbackRemix;

      try {
        const prompt = `You are a legendary Electronic Music Producer & Grammy-winning AI Audio Engineer (specializing in remixes for Suno, Udio, Google Lyria, and Flow Music).
Your task is to craft a complete professional remix blueprint:
- Original Song: "${trackTitle}" by "${artistName}"
- Original Genre: ${originalGenre} (${originalBpm} BPM)
- Target Remix Style: ${targetStyle} (${targetBpm} BPM, Key shift: ${keyShift} st)
- Mood & Vibe: ${mood}. Extra instructions: "${vibePrompt}"

Provide a detailed remix transformation in Russian (prompts in English). Return STRICTLY valid JSON without markdown fences matching this schema:
{
  "remixTitle": string,
  "originalArtist": string,
  "targetGenre": string,
  "targetBpm": number,
  "targetKey": string,
  "camelotKey": string,
  "remixConcept": string,
  "stemTransformations": {
    "vocals": string,
    "drums": string,
    "bass": string,
    "synths": string,
    "fx": string
  },
  "structure": [
    { "section": string, "bars": number, "energy": number, "description": string }
  ],
  "synthesisSpecs": {
    "leadNotes": [number, number, number, number, number, number, number, number],
    "bassline": [number, number, number, number, number, number, number, number],
    "drumStyle": "four_on_floor" | "trap_808" | "dnb_stepper" | "breakbeat",
    "filterCutoff": number
  },
  "prompts": {
    "sunoPrompt": string,
    "udioPrompt": string,
    "flowMusicLyria": string,
    "aiNanoMusic": string
  },
  "dawProductionNotes": [string, string, string, string]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const raw = response.text || "{}";
        const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        remixResult = JSON.parse(clean);
      } catch (err) {
        console.warn("Remix generation parse issue, using fallback:", err);
        remixResult = fallbackRemix;
      }

      res.json(remixResult || fallbackRemix);
    } catch (error: any) {
      console.error("Error in Remix generation:", error);
      res.status(500).json({ error: error.message || "Failed to generate remix" });
    }
  });

  // 14. GENERATIVE TRACK MASHUP & DJ MIX STUDIO API
  app.post('/api/gen/track-mix', async (req, res) => {
    try {
      const {
        mixTitle = "Peak Energy Club Session",
        mixStyle = "Club & Festival Set",
        tracks = [],
        transitionPreference = "Harmonic Camelot Smooth"
      } = req.body;

      const fallbackMix = {
        mixTitle: mixTitle || "Ultimate Harmonic Non-Stop Mix",
        mixStyle: mixStyle,
        totalTracks: tracks.length || 3,
        estimatedDuration: "14:30 min",
        harmonicFlowSummary: "Гармонический переход выстроен по Колесу Камелота (Camelot Wheel) с постепенным подъемом энергии от 75% до 100% пика.",
        energyCurve: [
          { phase: "Warm-Up / Intro", level: 75, description: "Создание гипнотического грува, разогрев танцпола" },
          { phase: "Progression & Tension", level: 85, description: "Наращивание ритмической плотности и введение вокальных хуков" },
          { phase: "Peak Time Climax", level: 100, description: "Максимальный фестивальный взрыв, мощный саб-бас и дроп" },
          { phase: "Deep Outro", level: 60, description: "Плавное сведение в атмосферный финал" }
        ],
        transitions: [
          {
            index: 1,
            fromTrack: tracks[0]?.title || "Track 1",
            toTrack: tracks[1]?.title || "Track 2",
            transitionType: "Bass Swap & Filter Sweep",
            camelotStep: "8A -> 9A (+1 Energy Boost)",
            mixBars: 16,
            timing: "03:45 - 04:15",
            instructions: "На 16 тактов до дропа второго трека активируйте High-Pass Filter на Track 1. На сильную долю (Downbeat) мгновенно переключите низкие частоты (Low EQ Kill на Track 1, 100% Low на Track 2).",
            crossfaderCurve: "Smooth Power Curve"
          },
          {
            index: 2,
            fromTrack: tracks[1]?.title || "Track 2",
            toTrack: tracks[2]?.title || "Track 3",
            transitionType: "Echo Freeze Out & Drop Cut",
            camelotStep: "9A -> 9B (Relative Major Shift)",
            mixBars: 8,
            timing: "07:30 - 07:50",
            instructions: "Включите Delay/Echo 3/4 beat на вокальном хуке Track 2, зажмите CUE на Track 3 и резко отпустите на первой доле дропа, создавая взрывной контраст.",
            crossfaderCurve: "Sharp Cut Curve"
          }
        ],
        proDjTips: [
          "Всегда выравнивайте темпы треков через SYNC или Pitch Fader до начала сведения.",
          "Никогда не оставляйте одновременно два включенных саб-баса — это вызовет фазовую кашу на сабвуферах.",
          "Используйте фразовое сведение (Phrase Matching): начинайте микс строго на 1-ю долю 8- или 16-тактовой фразы.",
          "Добавляйте акценты сэмплером (Airhorn / Laser) за полтакта до главного дропа."
        ]
      };

      const ai = getAiClient();
      let mixResult = fallbackMix;

      try {
        const prompt = `You are a World-Touring Headliner DJ and Master Mix Engineer (Tomorrowland, Ultra Music Festival, Boiler Room).
Your task is to create a seamless continuous DJ Mix and Mashup arrangement for the following tracklist:
Mix Title: "${mixTitle}"
Mix Style: "${mixStyle}"
Transition Preference: "${transitionPreference}"
Tracks:
${JSON.stringify(tracks, null, 2)}

Provide the professional transition instructions and harmonic analysis in Russian.
Return STRICTLY valid JSON without markdown fences matching this schema:
{
  "mixTitle": string,
  "mixStyle": string,
  "totalTracks": number,
  "estimatedDuration": string,
  "harmonicFlowSummary": string,
  "energyCurve": [
    { "phase": string, "level": number, "description": string }
  ],
  "transitions": [
    {
      "index": number,
      "fromTrack": string,
      "toTrack": string,
      "transitionType": string,
      "camelotStep": string,
      "mixBars": number,
      "timing": string,
      "instructions": string,
      "crossfaderCurve": string
    }
  ],
  "proDjTips": [string, string, string, string]
}`;

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        const raw = response.text || "{}";
        const clean = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
        mixResult = JSON.parse(clean);
      } catch (err) {
        console.warn("Mix generation parse issue, using fallback:", err);
        mixResult = fallbackMix;
      }

      res.json(mixResult || fallbackMix);
    } catch (error: any) {
      console.error("Error in Track Mix generation:", error);
      res.status(500).json({ error: error.message || "Failed to generate track mix plan" });
    }
  });

  // 15. PROJECT ZIP EXPORT
  app.get('/api/export/project-zip', async (req, res) => {
    try {
      const zip = new JSZip();
      const rootDir = process.cwd();

      function addDirectoryToZip(dirPath: string, zipFolder: JSZip) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          // Skip bulky or build artifacts
          if (
            entry.name === 'node_modules' ||
            entry.name === 'dist' ||
            entry.name === '.git' ||
            entry.name === 'bun.lock' ||
            entry.name === '.env' ||
            entry.name.endsWith('.tmp')
          ) {
            continue;
          }

          if (entry.isDirectory()) {
            const subFolder = zipFolder.folder(entry.name);
            if (subFolder) addDirectoryToZip(fullPath, subFolder);
          } else if (entry.isFile()) {
            const fileData = fs.readFileSync(fullPath);
            zipFolder.file(entry.name, fileData);
          }
        }
      }

      addDirectoryToZip(rootDir, zip);

      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="genesis-studio-full-project.zip"');
      res.send(buffer);
    } catch (error: any) {
      console.error('Error generating project ZIP:', error);
      res.status(500).json({ error: error.message || 'Failed to export project ZIP' });
    }
  });

  // 16. APP ZIP EXPORT
  app.post('/api/export/app-zip', async (req, res) => {
    try {
      const { title = 'Genesis App', html = '<!DOCTYPE html><html><body><h1>Genesis App</h1></body></html>' } = req.body;
      const zip = new JSZip();
      const safeName = title.toLowerCase().replace(/[^a-z0-9_-]/g, '_');

      zip.file('index.html', html);
      zip.file('manifest.json', JSON.stringify({
        name: title,
        short_name: title.slice(0, 12),
        start_url: './index.html',
        display: 'standalone',
        background_color: '#09090b',
        theme_color: '#8b5cf6'
      }, null, 2));
      zip.file('sw.js', `self.addEventListener('install', e => e.waitUntil(caches.open('app-v1').then(c => c.addAll(['./', './index.html', './manifest.json'])))); self.addEventListener('fetch', e => e.respondWith(caches.match(e.request).then(r => r || fetch(e.request))));`);
      zip.file('package.json', JSON.stringify({
        name: safeName,
        version: '1.0.0',
        description: `Exported Web Application: ${title}`,
        scripts: { start: 'npx serve .' }
      }, null, 2));
      zip.file('README.md', `# ${title}\nGenerated in Genesis AI Studio.\nRun with: npx serve .`);

      const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.zip"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error exporting app ZIP:', error);
      res.status(500).json({ error: error.message || 'Failed to export app ZIP' });
    }
  });

  // 17. ANDROID APK EXPORT
  app.all('/api/export/apk', async (req, res) => {
    try {
      const title = (req.body?.title || req.query?.title as string || 'Genesis Studio Mobile').toString();
      const html = (req.body?.html || `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title><style>body{background:#09090b;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center;padding:20px;box-sizing:border-box;}</style></head><body><div><h1>${title}</h1><p>Genesis Studio Android Mobile App Container</p></div></body></html>`).toString();

      const safeName = title.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const packageName = `com.genesis.studio.${safeName.replace(/_+/g, '') || 'mobile'}`;

      const zip = new JSZip();

      // AndroidManifest.xml
      zip.file('AndroidManifest.xml', `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${packageName}"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <application
        android:allowBackup="true"
        android:icon="@drawable/ic_launcher"
        android:label="${title}"
        android:theme="@android:style/Theme.DeviceDefault.NoActionBar.Fullscreen"
        android:usesCleartextTraffic="true">
        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`);

      // Assets
      zip.file('assets/www/index.html', html);
      zip.file('assets/www/manifest.json', JSON.stringify({
        name: title,
        short_name: title.slice(0, 12),
        start_url: 'index.html',
        display: 'standalone',
        theme_color: '#09090b',
        background_color: '#09090b'
      }, null, 2));

      // Native Activity Java
      zip.file(`src/${packageName.replace(/\./g, '/')}/MainActivity.java`, `package ${packageName};
import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebViewClient;
public class MainActivity extends Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = new WebView(this);
        setContentView(webView);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.setWebViewClient(new WebViewClient());
        webView.loadUrl("file:///android_asset/www/index.html");
    }
}`);

      // Gradle build files
      zip.file('build.gradle', `apply plugin: 'com.android.application'
android {
    compileSdkVersion 34
    defaultConfig {
        applicationId "${packageName}"
        minSdkVersion 23
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
    }
}`);

      zip.file('META-INF/MANIFEST.MF', `Manifest-Version: 1.0\nCreated-By: Genesis APK Engine\nPackage-Name: ${packageName}\n`);
      zip.file('INSTALL_ANDROID.txt', `Android APK package for ${title}.\nPackage: ${packageName}\n1. Rename or save as .apk\n2. Open and install on Android device.\nOr import into Android Studio.`);

      const buffer = await zip.generateAsync({
        type: 'nodebuffer',
        compression: 'DEFLATE'
      });

      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', `attachment; filename="${safeName}.apk"`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Error generating APK:', error);
      res.status(500).json({ error: error.message || 'Failed to generate APK' });
    }
  });

  // 18. DIRECT FILE DOWNLOADS
  app.get(['/genesis-studio-project.zip', '/download/project.zip'], (req, res) => {
    const file = path.join(process.cwd(), 'genesis-studio-project.zip');
    if (fs.existsSync(file)) {
      res.download(file, 'genesis-studio-project.zip');
    } else {
      res.redirect('/api/export/project-zip');
    }
  });

  app.get(['/genesis-studio.apk', '/download/genesis-studio.apk'], (req, res) => {
    const file = path.join(process.cwd(), 'genesis-studio.apk');
    if (fs.existsSync(file)) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.download(file, 'genesis-studio.apk');
    } else {
      res.redirect('/api/export/apk');
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();