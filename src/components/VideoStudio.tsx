import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Loader2,
  ArrowRight,
  ChevronRight,
  Download,
  Video,
  Sparkles,
  Wand2,
  Film,
  ExternalLink,
  Compass,
  Camera,
  Copy,
  Check,
  Sliders,
  Move3d,
  Layers
} from 'lucide-react';
import { PRODUCTS, ATMOSPHERES, MediaSelection } from '../data.js';
import { ImageUploader } from './ImageUploader.js';
import { VideoOutput } from './VideoOutput.js';
import { ScrollRow } from './ScrollRow.js';
import { toInlineImages, InlineImage } from '../images.js';

type LogType = 'info' | 'success' | 'warn' | 'error';
type AppState = 'IDLE' | 'GENERATING_ATMOSPHERE' | 'GENERATING_PROMPT' | 'GENERATING_VIDEO' | 'VIDEO_READY';

interface VideoVersion {
  label: string;          // 'V1', 'V2', ...
  interactionId: string;  // Omni interaction id — chained from for edits
  videoUrl: string;
  prompt: string;         // the cinematic directive (V1) or the edit instructions
}

export const VideoStudio: React.FC = () => {
  const [videoEngine, setVideoEngine] = useState<'omni' | 'higgsfield'>('omni');
  const [product, setProduct] = useState<MediaSelection | null>(null);
  const [atmosphere, setAtmosphere] = useState<MediaSelection | null>(null);
  const [duration, setDuration] = useState<string>('10s');
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [submittedImages, setSubmittedImages] = useState<string[]>([]);

  // Higgsfield state
  const [higgsPrompt, setHiggsPrompt] = useState('Кинематографичный пролет камеры вокруг футуристичного объекта в студии с неоновым контровым светом');
  const [cameraMotion, setCameraMotion] = useState('dolly_zoom');
  const [lensType, setLensType] = useState('anamorphic_35mm');
  const [motionSpeed, setMotionSpeed] = useState('dynamic');
  const [higgsResult, setHiggsResult] = useState<any>(null);
  const [isGeneratingHiggs, setIsGeneratingHiggs] = useState(false);
  const [higgsCopied, setHiggsCopied] = useState(false);

  const [generateOpen, setGenerateOpen] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState('');

  const [versions, setVersions] = useState<VideoVersion[]>([]);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const versionCount = useRef(0);

  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [promptOpen, setPromptOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [logs, setLogs] = useState<{ id: string; timestamp: string; message: string; type: LogType; image?: string }[]>([]);

  const addLog = (message: string, type: LogType = 'info', image?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString().split('T')[1].substring(0, 12),
      message,
      type,
      image
    }]);
  };

  const describe = (sel: MediaSelection) => sel.description || `${sel.images.length} uploaded image${sel.images.length > 1 ? 's' : ''}`;

  const handleRandomSetup = () => {
    const randomProduct = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    const randomAtmosphere = ATMOSPHERES[Math.floor(Math.random() * ATMOSPHERES.length)];
    setProduct(randomProduct);
    setAtmosphere(randomAtmosphere);
  };

  const usingGenerate = !atmosphere && generatePrompt.trim().length > 0;
  const hasAtmosphere = !!atmosphere || usingGenerate;

  const selectAtmosphere: React.Dispatch<React.SetStateAction<MediaSelection | null>> = (value) => {
    setAtmosphere(value);
    if (typeof value !== 'function' && value) {
      setGenerateOpen(false);
      setGeneratePrompt('');
    }
  };

  const isGenerating = appState === 'GENERATING_ATMOSPHERE' || appState === 'GENERATING_PROMPT' || appState === 'GENERATING_VIDEO';
  const canSubmit = !!product && hasAtmosphere && !isGenerating;

  const submitHint = isGenerating
    ? 'Генерация видео — пожалуйста подождите'
    : !product && !hasAtmosphere
    ? 'Добавьте фото продукта и атмосферу'
    : !product
    ? 'Добавьте фото продукта'
    : !hasAtmosphere
    ? 'Выберите или сгенерируйте атмосферу'
    : undefined;

  const selected = versions.find(v => v.label === selectedLabel) ?? null;
  const otherVersions = versions.filter(v => v.label !== selectedLabel);

  const addVersion = (interactionId: string, fileId: string, promptText: string) => {
    const label = `V${++versionCount.current}`;
    setVersions(prev => [...prev, { label, interactionId, videoUrl: `/api/video/${fileId}`, prompt: promptText }]);
    setSelectedLabel(label);
  };

  const pollVideoStatus = (fileId: string, interactionId: string, promptText: string, isInitial: boolean) => {
    addLog('Опрос Omni о статусе рендера...', 'warn');
    let lastState = '';

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/file-status/${fileId}`);
        const data = await res.json();

        if (data.state === 'ACTIVE') {
          clearInterval(interval);
          addLog('Рендер видео завершен. Поток готов.', 'success');
          addVersion(interactionId, fileId, promptText);
          setAppState('VIDEO_READY');
          if (isInitial) {
            setProduct(null);
            setAtmosphere(null);
            setGenerateOpen(false);
            setGeneratePrompt('');
          }
        } else if (data.state === 'FAILED') {
          clearInterval(interval);
          addLog('Omni backend вернул ошибку FAILED.', 'error');
          setAppState(isInitial ? 'IDLE' : 'VIDEO_READY');
        } else if (data.state !== lastState) {
          lastState = data.state;
          addLog(`Статус рендера: ${data.state}`);
        }
      } catch (e: any) {
        addLog(`Ошибка опроса: ${e.message}`, 'error');
      }
    }, 5000);
  };

  const handleSubmit = async () => {
    if (!product || !hasAtmosphere) {
      addLog('Пожалуйста добавьте продукт и атмосферу.', 'error');
      return;
    }
    const settingInput = generatePrompt.trim();

    versionCount.current = 0;
    setVersions([]);
    setSelectedLabel(null);
    setEditOpen(false);
    setPromptOpen(false);

    try {
      const productImages = await toInlineImages(product.images);
      const productLabel = product.source === 'suggestion' ? product.id : 'product';

      let atmosphereImages: InlineImage[];
      let atmosphereDesc: string;
      let atmosphereSources: string[];

      if (usingGenerate) {
        setAppState('GENERATING_ATMOSPHERE');
        addLog(`Генерация атмосферы из: "${settingInput}"`, 'info');
        addLog('Написание визуального промпта (Gemini Flash Lite)…', 'warn');
        addLog('Рендеринг фона gemini-3.1-flash-lite-image…', 'warn');

        const atmoRes = await fetch('/api/generate-atmosphere', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: settingInput })
        });
        const atmoData = await atmoRes.json();
        if (!atmoRes.ok) throw new Error(atmoData.error || 'Failed to generate atmosphere');

        const atmoDataUrl = `data:${atmoData.image.mimeType};base64,${atmoData.image.data}`;
        addLog('Фон атмосферы готов.', 'success', atmoDataUrl);
        atmosphereImages = [{ data: atmoData.image.data, mimeType: atmoData.image.mimeType }];
        atmosphereDesc = (atmoData.prompt as string) || settingInput;
        atmosphereSources = [atmoDataUrl];
      } else {
        setAppState('GENERATING_PROMPT');
        addLog('Анализ входных изображений...');
        addLog(`Продукт: ${describe(product)}`, 'info');
        addLog(`Атмосфера: ${describe(atmosphere!)}`, 'info');
        addLog('Кодирование референсов...', 'warn');
        atmosphereImages = await toInlineImages(atmosphere!.images);
        atmosphereDesc = atmosphere!.description.replace(/\{product_id\}/g, productLabel);
        atmosphereSources = atmosphere!.images;
      }

      setSubmittedImages([...product.images, ...atmosphereSources]);

      setAppState('GENERATING_PROMPT');
      addLog('Запрос трансляции режиссерского сценария в Gemini Flash...', 'warn');
      const promptRes = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDesc: product.description, atmosphereDesc, productImages, atmosphereImages, duration })
      });
      const promptData = await promptRes.json();
      if (!promptRes.ok) throw new Error(promptData.error || 'Failed to generate prompt');

      const generatedPrompt = promptData.prompt as string;
      addLog('Режиссерский сценарий готов.', 'success');

      setAppState('GENERATING_VIDEO');
      addLog(`Запуск пайплайна видеогенерации Omni (${duration})...`);

      const videoRes = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: generatedPrompt, productImages, atmosphereImages, duration })
      });
      const videoData = await videoRes.json();
      if (!videoRes.ok) throw new Error(videoData.error || 'Failed to start video generation');

      addLog(`Рендер запущен. ID интеракции: ${videoData.interactionId}`, 'success');
      pollVideoStatus(videoData.fileId, videoData.interactionId, generatedPrompt, true);
    } catch (e: any) {
      setAppState('IDLE');
      addLog(`Ошибка: ${e.message}`, 'error');
    }
  };

  const handleEdit = async () => {
    if (!selected || !editText.trim() || isGenerating) return;
    const instructions = editText.trim();
    const fromLabel = selected.label;
    const fromInteractionId = selected.interactionId;

    setEditOpen(false);
    setEditText('');
    setAppState('GENERATING_VIDEO');
    addLog(`Правка версии ${fromLabel}: ${instructions}`, 'warn');

    try {
      const res = await fetch('/api/edit-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousInteractionId: fromInteractionId, instructions })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Правка не удалась');

      addLog(`Сессия правок создана: ${data.interactionId}`, 'success');
      pollVideoStatus(data.fileId, data.interactionId, instructions, false);
    } catch (e: any) {
      setAppState('VIDEO_READY');
      addLog(`Ошибка правки: ${e.message}`, 'error');
    }
  };

  const selectVersion = (label: string) => {
    setSelectedLabel(label);
    setEditOpen(false);
  };

  const downloadVideo = async (version: VideoVersion) => {
    setDownloading(true);
    try {
      const res = await fetch(version.videoUrl, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `omni-${version.label.toLowerCase()}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      addLog(`Ошибка скачивания: ${e.message}`, 'error');
    } finally {
      setDownloading(false);
    }
  };

  const handleGenerateHiggsfield = async () => {
    if (!higgsPrompt.trim()) return;
    setIsGeneratingHiggs(true);
    try {
      const res = await fetch('/api/gen/higgsfield', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: higgsPrompt,
          cameraMotion,
          lensType,
          motionSpeed
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setHiggsResult(data);
    } catch (err: any) {
      console.error('Error generating Higgsfield specs:', err);
    } finally {
      setIsGeneratingHiggs(false);
    }
  };

  const handleCopyHiggs = (text: string) => {
    navigator.clipboard.writeText(text);
    setHiggsCopied(true);
    setTimeout(() => setHiggsCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Engine Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVideoEngine('omni')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              videoEngine === 'omni'
                ? 'bg-amber-500 text-zinc-950 shadow-md scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Gemini Omni Flash</span>
          </button>

          <button
            onClick={() => setVideoEngine('higgsfield')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              videoEngine === 'higgsfield'
                ? 'bg-gradient-to-r from-orange-500 to-rose-600 text-white shadow-md scale-[1.02]'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <Camera className="w-4 h-4 text-orange-400" />
            <span>Higgsfield AI (higgsfield.ai)</span>
          </button>
        </div>

        <a
          href="https://higgsfield.ai"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold transition-all cursor-pointer w-fit"
        >
          <span>Перейти на higgsfield.ai</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {videoEngine === 'higgsfield' ? (
        /* HIGGSFIELD AI CINEMA STUDIO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Higgsfield Camera Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl border border-orange-500/20">
                    <Move3d className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">Higgsfield AI • Физика Камеры</h3>
                    <p className="text-xs text-zinc-400">Кинематографичные траектории и динамика</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40">
                  higgsfield.ai
                </span>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Сцена и объект съемки</label>
                <textarea
                  rows={3}
                  value={higgsPrompt}
                  onChange={e => setHiggsPrompt(e.target.value)}
                  placeholder="Опишите сцену для генерации кинематографичного видео..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 focus:outline-none focus:border-orange-500 leading-relaxed font-sans"
                />
              </div>

              {/* Camera Motion Type */}
              <div>
                <label className="text-xs text-zinc-400 block mb-2 font-medium">Траектория движения камеры</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'dolly_zoom', label: 'Dolly Zoom (Vertigo)', desc: 'Наезд с компенсацией зума' },
                    { id: 'orbit_360', label: '360 Bullet-Time Orbit', desc: 'Круговой облет матричного типа' },
                    { id: 'fpv_drone', label: 'FPV Drone Drift', desc: 'Скоростной пролет от первого лица' },
                    { id: 'crane_down', label: 'Crane Down', desc: 'Спуск крана сверху вниз' },
                    { id: 'dutch_pan', label: 'Dutch Angle Roll', desc: 'Динамичный наклон горизонта' }
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setCameraMotion(item.id)}
                      className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                        cameraMotion === item.id
                          ? 'border-orange-500 bg-orange-500/15 text-orange-200 shadow'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <div className="text-xs font-bold text-zinc-200">{item.label}</div>
                      <div className="text-[10px] text-zinc-500 mt-0.5">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Lens & Speed */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Кинообъектив</label>
                  <select
                    value={lensType}
                    onChange={e => setLensType(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="anamorphic_35mm">Анаморфный 35mm T1.5</option>
                    <option value="imax_70mm">IMAX 70mm Large Format</option>
                    <option value="prime_50mm">50mm Prime Portrait</option>
                    <option value="vintage_panavision">Panavision Vintage 1970s</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1.5 font-medium">Скорость камеры</label>
                  <select
                    value={motionSpeed}
                    onChange={e => setMotionSpeed(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-orange-500"
                  >
                    <option value="cinematic-slow">Cinematic Slow-Mo (60-120fps)</option>
                    <option value="dynamic">Динамичный темп (Dynamic)</option>
                    <option value="hyperspeed">Hyper-Speed Drone</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateHiggsfield}
                disabled={isGeneratingHiggs}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-400 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-orange-500/20 cursor-pointer disabled:opacity-50"
              >
                {isGeneratingHiggs ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Расчет кинематографических векторов...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Сгенерировать кино-промпт Higgsfield</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right: Higgsfield Output & Portal Card */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                <h3 className="text-sm font-bold text-zinc-200">Параметры генерации Higgsfield AI</h3>
                {higgsResult && (
                  <button
                    onClick={() => handleCopyHiggs(higgsResult.higgsfieldCopyableString)}
                    className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer font-medium"
                  >
                    {higgsCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Скопировать готовый промпт</span>
                  </button>
                )}
              </div>

              {higgsResult ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <div className="text-xs font-bold text-orange-400">{higgsResult.projectTitle}</div>
                    <p className="text-xs text-zinc-300 leading-relaxed font-mono">
                      {higgsResult.higgsfieldPrompt}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-mono">Вектор движения</div>
                      <div className="font-semibold text-zinc-200 mt-0.5">
                        {higgsResult.cameraTrajectory?.vector || 'Linear motion'}
                      </div>
                    </div>
                    <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                      <div className="text-[10px] text-zinc-500 uppercase font-mono">Цветокоррекция</div>
                      <div className="font-semibold text-zinc-200 mt-0.5">
                        {higgsResult.lensAndFilm?.colorGrading || 'Rec.709 Cinema'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-orange-950/20 border border-orange-800/40 text-xs">
                    <div className="text-[11px] text-zinc-400 mb-1">Копируемая строка для вставки в Higgsfield.ai:</div>
                    <div className="font-mono text-[11px] text-orange-300 break-all bg-black/40 p-2 rounded">
                      {higgsResult.higgsfieldCopyableString}
                    </div>
                  </div>

                  <a
                    href="https://higgsfield.ai"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-rose-600 to-pink-600 hover:from-orange-500 hover:to-rose-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-orange-600/25 transition-all cursor-pointer"
                  >
                    <span>Открыть higgsfield.ai и вставить промпт</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              ) : (
                <div className="py-16 text-center text-zinc-500 space-y-3">
                  <Camera className="w-10 h-10 mx-auto opacity-30 text-orange-400" />
                  <p className="text-xs">
                    Настройте камеру и нажмите «Сгенерировать кино-промпт Higgsfield» для получения точных физических параметров съемки.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ORIGINAL GEMINI OMNI FLASH STUDIO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT - BUILDER */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-zinc-100">Генератор Кинематографичных Видео</h3>
                  <p className="text-xs text-zinc-400">Gemini Omni Flash • Студийные шоты и рилсы</p>
                </div>
              </div>

              <div className="space-y-4">
                <ImageUploader
                  title="Изображения продукта / Объекта"
                  type="product"
                  suggestions={PRODUCTS}
                  selection={product}
                  onSelect={setProduct}
                  disabled={isGenerating}
                />

                <ImageUploader
                  title="Студийная атмосфера / Фон"
                  type="atmosphere"
                  suggestions={ATMOSPHERES}
                  selection={atmosphere}
                  onSelect={selectAtmosphere}
                  disabled={isGenerating}
                />

                {/* Reel Duration Slider */}
                <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Длительность рилса</span>
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded-lg">
                      {duration}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="15"
                    step="5"
                    value={parseInt(duration, 10)}
                    onChange={(e) => setDuration(`${e.target.value}s`)}
                    disabled={isGenerating}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-500">
                    <span>5 секунд</span>
                    <span>10 секунд</span>
                    <span>15 секунд</span>
                  </div>
                </div>

                {/* Submit Button */}
                <div title={submitHint} className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleRandomSetup}
                    disabled={isGenerating}
                    className="px-3.5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-semibold flex items-center justify-center transition-colors disabled:opacity-40"
                    title="Случайная комбинация продукта и фона"
                  >
                    🎲
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Съемка и рендер видеокадров…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Сгенерировать видео</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - OUTPUT */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          {/* Previous versions row */}
          {otherVersions.length > 0 && (
            <div className="mb-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                История дублей:
              </span>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {otherVersions.map(v => (
                  <button
                    key={v.label}
                    onClick={() => selectVersion(v.label)}
                    className="group flex-none text-left p-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all"
                  >
                    <div className="text-[10px] font-mono text-zinc-400 group-hover:text-amber-400 mb-1">{v.label}</div>
                    <video
                      src={v.videoUrl}
                      muted
                      playsInline
                      preload="metadata"
                      className="w-32 aspect-video object-cover bg-black rounded-lg opacity-70 group-hover:opacity-100"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Video Screen */}
          <div className="relative">
            {appState === 'VIDEO_READY' && selected && (
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                  {selected.label}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditOpen(o => !o)}
                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors"
                  >
                    {editOpen ? 'Закрыть правки' : 'Изменить сцену'}
                  </button>
                  <button
                    onClick={() => downloadVideo(selected)}
                    disabled={downloading}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{downloading ? 'Загрузка...' : 'Скачать MP4'}</span>
                  </button>
                </div>
              </div>
            )}

            <VideoOutput
              appState={appState}
              videoUrl={selected?.videoUrl || null}
              logs={logs}
            />

            {/* Prompt Drawer */}
            {selected && (
              <div className="mt-4 border-t border-zinc-800/80 pt-4">
                <button
                  onClick={() => setPromptOpen(o => !o)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${promptOpen ? 'rotate-90' : ''}`} />
                  <span>Показать режиссерский сценарий</span>
                </button>
                {promptOpen && (
                  <pre className="mt-2 p-4 bg-zinc-950 rounded-xl border border-zinc-800 text-[11px] font-mono text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {selected.prompt}
                  </pre>
                )}
              </div>
            )}

            {/* Edit Drawer */}
            {editOpen && selected && (
              <div className="mt-4 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 space-y-3">
                <span className="text-xs font-semibold text-zinc-200 block">Правка текущей сцены (Omni Chain)</span>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  placeholder="Опишите изменения (например: сделай свет более теплым, добавь замедленное вращение)..."
                  rows={2}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 outline-none focus:border-amber-500"
                />
                <button
                  onClick={handleEdit}
                  disabled={!editText.trim() || isGenerating}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-40"
                >
                  Применить правку к {selected.label}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )}
</div>
);
};
