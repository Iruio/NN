import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Music,
  UserCheck,
  Palette,
  Sparkles,
  Play,
  Pause,
  Sliders,
  Copy,
  Check,
  Zap,
  Layers,
  Camera,
  Activity,
  Mic,
  Maximize2,
  Clock,
  Radio,
  Volume2,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface MusicVideoScene {
  sceneNumber: number;
  timecode: string;
  songSection: string;
  beatTrigger: string;
  lipSync: {
    lyricsLine: string;
    visemes: string;
    singingEmotion: string;
    mouthOpenness: string;
  };
  sceneDescription: string;
  cameraMotion: string;
  characterAction: string;
  videoPromptVeo: string;
  videoPromptHiggsfield: string;
}

interface MusicVideoResult {
  trackAnalysis: {
    bpm: number;
    beatDurationSeconds: string;
    barDurationSeconds: string;
    structureFlow: string;
    bassDropPoints: string[];
    visualSyncStrategy: string;
  };
  characterDNALock: {
    seedTag: string;
    masterCharacterPrompt: string;
    consistencyRules: string[];
    negativePrompt: string;
  };
  styleMasterLock: {
    styleName: string;
    unifiedStylePrompt: string;
    negativeStylePrompt: string;
    colorGradingNotes: string;
    aspectRatio: string;
  };
  scenes: MusicVideoScene[];
  productionTips: {
    lipSyncWorkflow: string;
    characterConsistencyWorkflow: string;
    renderingRecommendation: string;
  };
}

const PRESET_TRACKS = [
  {
    name: 'Cyberpunk Synthwave (128 BPM)',
    trackTitle: 'Neon Pulse Overdrive',
    artistName: 'Alex Vance',
    genre: 'synthwave',
    bpm: 128,
    lyrics: `[Verse 1]\nRaindrops falling on the neon glass\nShadows moving, time is moving fast\n[Chorus]\nFeel the electric frequency tonight\nWe illuminate the dark into the light\n[Drop]\nBass kicks in, breaking through the wall!`,
    charName: 'Alex Vance',
    charFeatures: 'Glowing cybernetic cyan iris in right eye, silver-streaked dark hair, high-tech cheek scar',
    charOutfit: 'Matte black armored tactical leather jacket with luminous violet fiber-optic seams, metallic chain necklace',
    charSeed: 'char_alex_vance_synthwave_core',
    stylePreset: 'cyberpunk_noir',
    styleLighting: 'High-contrast neon backlighting, wet reflective asphalt, moody anamorphic blue and magenta lens flares'
  },
  {
    name: 'Hip-Hop Trap (140 BPM)',
    trackTitle: 'Crown of Shadows',
    artistName: 'Marcus King',
    genre: 'hiphop',
    bpm: 140,
    lyrics: `[Intro]\nYeah, straight from the concrete\n[Verse 1]\nCount the paper while the engine roars\nOpened up every single locked door\n[Chorus Drop]\nWe take the crown, never looking back\nEvery beat heavy on the stereo track!`,
    charName: 'Marcus King',
    charFeatures: 'Sharp jawline, close-cropped fade haircut, discreet gold tooth cap, intense direct gaze',
    charOutfit: 'Oversized distressed vintage charcoal hoodie with heavy Cuban link gold chain and luxury chronograph',
    charSeed: 'char_marcus_king_trap_v1',
    stylePreset: 'cinematic_35mm',
    styleLighting: 'Low-key Kodak 5219 35mm film aesthetic, golden hour rim lighting through smoke, deep rich shadows'
  },
  {
    name: 'Anime Cyber Pop (135 BPM)',
    trackTitle: 'Starlight Valkyrie',
    artistName: 'Aoi Sakura',
    genre: 'pop',
    bpm: 135,
    lyrics: `[Intro]\nKira kira starlight shining bright\n[Verse 1]\nBeyond the orbit of the stratosphere\nI hear your melody so crystal clear\n[Chorus]\nWings of light unfold into the sky\nTogether forever, you and I!`,
    charName: 'Aoi Sakura',
    charFeatures: 'Anime-styled expressive violet eyes, twin-tailed pastel pink hair with holographic highlights',
    charOutfit: 'Futuristic mecha idol stage dress with glowing fiber ribbons, winged metallic headphones',
    charSeed: 'char_aoi_sakura_anime_core',
    stylePreset: 'anime_shonen',
    styleLighting: 'Makoto Shinkai style sky gradients, sparkling particle lens flare, soft blooming stage spotlight'
  }
];

export function MusicVideoStudio() {
  const [trackTitle, setTrackTitle] = useState('Neon Pulse Overdrive');
  const [artistName, setArtistName] = useState('Alex Vance');
  const [genre, setGenre] = useState('synthwave');
  const [bpm, setBpm] = useState(128);
  const [lyrics, setLyrics] = useState(`[Verse 1]\nRaindrops falling on the neon glass\nShadows moving, time is moving fast\n[Chorus]\nFeel the electric frequency tonight\nWe illuminate the dark into the light\n[Drop]\nBass kicks in, breaking through the wall!`);

  // Character DNA state
  const [charName, setCharName] = useState('Alex Vance');
  const [charFeatures, setCharFeatures] = useState('Glowing cybernetic cyan iris in right eye, silver-streaked dark hair, high-tech cheek scar');
  const [charOutfit, setCharOutfit] = useState('Matte black armored tactical leather jacket with luminous violet fiber-optic seams, metallic chain necklace');
  const [charSeed, setCharSeed] = useState('char_alex_vance_synthwave_core');

  // Style Lock state
  const [stylePreset, setStylePreset] = useState('cyberpunk_noir');
  const [styleLighting, setStyleLighting] = useState('High-contrast neon backlighting, wet reflective asphalt, moody anamorphic blue and magenta lens flares');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MusicVideoResult | null>(null);
  const [activeTab, setActiveTab] = useState<'storyboard' | 'character_lock' | 'style_lock' | 'beat_sync' | 'lip_sync_guide'>('storyboard');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Simulated Beat Visualizer
  const [isPlayingBeat, setIsPlayingBeat] = useState(false);
  const [beatPulse, setBeatPulse] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (isPlayingBeat) {
      const beatIntervalMs = (60 / bpm) * 1000;
      interval = setInterval(() => {
        setBeatPulse(prev => (prev + 1) % 4);
      }, beatIntervalMs);
    } else {
      setBeatPulse(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingBeat, bpm]);

  const handleCopy = (text: string, key: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).catch(() => {});
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (e) {
      console.warn('Clipboard copy error:', e);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleApplyPreset = (p: typeof PRESET_TRACKS[0]) => {
    setTrackTitle(p.trackTitle);
    setArtistName(p.artistName);
    setGenre(p.genre);
    setBpm(p.bpm);
    setLyrics(p.lyrics);
    setCharName(p.charName);
    setCharFeatures(p.charFeatures);
    setCharOutfit(p.charOutfit);
    setCharSeed(p.charSeed);
    setStylePreset(p.stylePreset);
    setStyleLighting(p.styleLighting);
  };

  const handleGenerate = async () => {
    if (!trackTitle.trim() || !lyrics.trim()) {
      setError('Укажите название трека и текст');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gen/music-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackTitle,
          artistName,
          genre,
          bpm,
          lyrics,
          character: {
            name: charName,
            features: charFeatures,
            outfit: charOutfit,
            seedTag: charSeed
          },
          visualStyle: {
            preset: stylePreset,
            lighting: styleLighting,
            colorPalette: ['#00F0FF', '#FF0055', '#16002A', '#FFE600'],
            cameraLens: 'ARRI Alexa 65, 35mm Master Anamorphic T1.9'
          },
          scenesCount: 6
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка при генерации музыкального клипа');
      }

      const mvData: MusicVideoResult = await res.json();
      setResult(mvData);
      setActiveTab('storyboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Сбой при создании сценария клипа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-violet-950/40 via-purple-900/20 to-zinc-900 border border-violet-800/40 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-violet-400" />
                AI Music Video Director
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-zinc-900 border border-zinc-700/60 text-zinc-300">
                Beat-Sync • Lip-Sync • Character Lock • Style Lock
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Студия Генерации Музыкальных Клипов
            </h2>
            <p className="text-zinc-400 text-sm max-w-2xl">
              Точная синхронизация видеокадров под ритмическую сетку и басы, липсинк артикуляции губ к тексту песни, сохранение постоянства внешности персонажа (Character Seed) и полный контроль визуального стиля во всех сценах для Veo 3.1, Higgsfield AI, Sora и Runway.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-xl shadow-purple-900/40 hover:from-violet-500 hover:to-pink-500 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Режиссируем клип...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Сгенерировать Клип</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-6 pt-5 border-t border-zinc-800/60 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-zinc-500 font-medium whitespace-nowrap">Готовые стили клипов:</span>
          {PRESET_TRACKS.map(p => (
            <button
              key={p.name}
              onClick={() => handleApplyPreset(p)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 hover:text-white hover:border-violet-500/50 hover:bg-violet-950/30 transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-violet-400" />
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Director Controls */}
        <div className="lg:col-span-5 space-y-5 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              Настройки Клипа & Трека
            </h3>
            <span className="text-[11px] text-zinc-400">Gemini 3.8 Multi-Scene</span>
          </div>

          {/* Track Title & Artist */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Название трека</label>
              <input
                type="text"
                value={trackTitle}
                onChange={e => setTrackTitle(e.target.value)}
                placeholder="Neon Pulse"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-violet-500 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">Имя артиста</label>
              <input
                type="text"
                value={artistName}
                onChange={e => setArtistName(e.target.value)}
                placeholder="Alex Vance"
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:border-violet-500 outline-none"
              />
            </div>
          </div>

          {/* BPM & Rhythm Visualizer Controller */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-white">Темп & Сетка Битов (BPM)</span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-violet-500/20 text-violet-300 font-mono text-xs font-bold">
                {bpm} BPM ({(60 / bpm).toFixed(2)}s/beat)
              </span>
            </div>

            <input
              type="range"
              min={70}
              max={175}
              value={bpm}
              onChange={e => setBpm(Number(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />

            {/* Simulated Live Rhythm Pulse Bar */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setIsPlayingBeat(!isPlayingBeat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isPlayingBeat
                    ? 'bg-rose-500 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:text-white'
                }`}
              >
                {isPlayingBeat ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isPlayingBeat ? 'Стоп Метроном' : 'Тест Пульса Битов'}</span>
              </button>

              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map(beat => (
                  <div
                    key={beat}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-[10px] font-bold transition-all ${
                      isPlayingBeat && beatPulse === beat
                        ? beat === 0
                          ? 'bg-violet-500 text-white scale-110 shadow-lg shadow-violet-500/50'
                          : 'bg-pink-500 text-white scale-105'
                        : 'bg-zinc-900 text-zinc-600 border border-zinc-800'
                    }`}
                  >
                    {beat + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lyrics with Vocal Cues */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-violet-400" />
                Текст Песни для Липсинка (Lip-Sync Lyrics)
              </label>
              <span className="text-[10px] text-zinc-500">Авто-разметка фонем</span>
            </div>
            <textarea
              rows={4}
              value={lyrics}
              onChange={e => setLyrics(e.target.value)}
              placeholder="Вставьте слова куплета и припева..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none transition-all resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Character Consistency DNA Lock Section */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-purple-950/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                Постоянство Персонажа (Character DNA Lock)
              </span>
              <span className="text-[10px] font-mono text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/40">
                LOCKED
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-zinc-400 text-[11px]">Имя и Seed-токен персонажа:</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="text"
                    value={charName}
                    onChange={e => setCharName(e.target.value)}
                    placeholder="Alex Vance"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white"
                  />
                  <input
                    type="text"
                    value={charSeed}
                    onChange={e => setCharSeed(e.target.value)}
                    placeholder="char_alex_v1"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-purple-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-zinc-400 text-[11px]">Уникальные черты лица (глаза, волосы, шрамы):</label>
                <input
                  type="text"
                  value={charFeatures}
                  onChange={e => setCharFeatures(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white mt-1"
                />
              </div>

              <div>
                <label className="text-zinc-400 text-[11px]">Фирменный костюм / гардероб во всех сценах:</label>
                <input
                  type="text"
                  value={charOutfit}
                  onChange={e => setCharOutfit(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white mt-1"
                />
              </div>
            </div>
          </div>

          {/* Visual Style Lock Section */}
          <div className="p-4 rounded-2xl bg-zinc-950/80 border border-pink-950/80 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-pink-400" />
                Единый Визуальный Стиль во Всех Сценах
              </span>
              <span className="text-[10px] font-mono text-pink-400 bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-800/40">
                100% UNIFIED
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'cyberpunk_noir', label: 'Cyberpunk Noir' },
                { id: 'cinematic_35mm', label: '35mm Kodak Film' },
                { id: 'anime_shonen', label: 'Anime Cel-Shaded' },
                { id: 'unreal_5_scifi', label: 'Unreal Engine 5' }
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => setStylePreset(s.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all cursor-pointer ${
                    stylePreset === s.id
                      ? 'bg-pink-500/15 border-pink-500 text-pink-300 font-semibold'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div>
              <label className="text-zinc-400 text-[11px]">Освещение, оптика и цветокоррекция:</label>
              <input
                type="text"
                value={styleLighting}
                onChange={e => setStyleLighting(e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white mt-1 text-xs"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800 text-red-300 text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 text-white font-bold text-sm shadow-lg shadow-purple-900/30 hover:from-violet-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Режиссура сцен и синхронизация...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Сгенерировать Сценарий Клипа</span>
              </>
            )}
          </button>
        </div>

        {/* Right Output: Interactive Timeline & Prompts */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !loading && (
            <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[540px]">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 mb-4">
                <Film className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Режиссерский пульт генерации клипов
              </h3>
              <p className="text-zinc-400 text-sm max-w-md mb-6">
                Создайте покадровый клип с синхронизацией по битам, точным липсинком, сохранением постоянства внешности персонажа и единой стилистикой.
              </p>
              <button
                onClick={handleGenerate}
                className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span>Быстрый тест: Neon Pulse Overdrive</span>
              </button>
            </div>
          )}

          {loading && (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center min-h-[540px] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/30 flex items-center justify-center text-violet-400 animate-pulse">
                <Sparkles className="w-8 h-8 animate-spin" />
              </div>
              <h3 className="text-lg font-bold text-white">Режиссируем покадровый клип...</h3>
              <p className="text-zinc-400 text-xs max-w-md">
                Синхронизируем смену планов с BPM {bpm}, рассчитываем артикуляцию губ под вокал, фиксируем Character Seed и генерируем мастер-промпты для Google Veo и Higgsfield AI.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Output Sub-Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto p-1.5 bg-zinc-900/90 border border-zinc-800 rounded-2xl">
                {[
                  { id: 'storyboard', label: 'Раскадровка Клипа (Сцены)', icon: Film },
                  { id: 'beat_sync', label: 'Бит-Сетка & Бас-Дропы', icon: Activity },
                  { id: 'character_lock', label: 'Character DNA Lock', icon: UserCheck },
                  { id: 'style_lock', label: 'Style Lock & Оптика', icon: Palette },
                  { id: 'lip_sync_guide', label: 'Липсинк Пайплайн', icon: Mic }
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                        isActive
                          ? 'bg-violet-600 text-white font-bold shadow-md shadow-violet-900/40'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: Scene-by-Scene Storyboard */}
              {activeTab === 'storyboard' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>Сцены клипа с синхронизацией битов и липсинком:</span>
                    <button
                      onClick={() => handleCopy(
                        result.scenes.map(s => `[СЦЕНА ${s.sceneNumber}] ${s.timecode} | ${s.songSection}\nБит-триггер: ${s.beatTrigger}\nЛипсинк вокала: "${s.lipSync.lyricsLine}" (${s.lipSync.visemes})\nКамера: ${s.cameraMotion}\nVeo 3.1 Prompt:\n${s.videoPromptVeo}\n\nHiggsfield Prompt:\n${s.videoPromptHiggsfield}`).join('\n\n---\n\n'),
                        'all-mv-scenes'
                      )}
                      className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'all-mv-scenes' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Скопировать все сцены</span>
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {result.scenes.map((scene, i) => (
                      <div
                        key={i}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4.5 space-y-3 hover:border-violet-500/50 transition-all shadow-md"
                      >
                        {/* Header: Scene, Timecode, Beat Trigger */}
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-xs font-mono font-bold">
                              Кадр {scene.sceneNumber} • {scene.timecode}
                            </span>
                            <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-zinc-800">
                              {scene.songSection}
                            </span>
                          </div>

                          <span className="text-[11px] font-mono text-pink-400 bg-pink-950/40 px-2 py-0.5 rounded border border-pink-800/40 flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {scene.beatTrigger}
                          </span>
                        </div>

                        {/* Lip-Sync Bar */}
                        <div className="p-3 rounded-xl bg-violet-950/30 border border-violet-800/40 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-violet-300 flex items-center gap-1.5">
                              <Mic className="w-3 h-3 text-violet-400" />
                              Слова песни в кадре (Липсинк):
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400">
                              Фонемы: {scene.lipSync.visemes}
                            </span>
                          </div>
                          <p className="text-sm font-semibold text-white italic">
                            «{scene.lipSync.lyricsLine}»
                          </p>
                          <div className="flex items-center gap-3 text-[11px] text-zinc-400 pt-1">
                            <span>Эмоция: <strong className="text-zinc-200">{scene.lipSync.singingEmotion}</strong></span>
                            <span>•</span>
                            <span>Рот: <strong className="text-zinc-200">{scene.lipSync.mouthOpenness}</strong></span>
                          </div>
                        </div>

                        {/* Scene details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                            <span className="text-zinc-500 font-semibold uppercase text-[10px]">Действие персонажа (Character Lock):</span>
                            <p className="text-zinc-200">{scene.characterAction}</p>
                          </div>

                          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1">
                            <span className="text-pink-400 font-semibold uppercase text-[10px]">Движение камеры (Camera Motion):</span>
                            <p className="text-zinc-200">{scene.cameraMotion}</p>
                          </div>
                        </div>

                        {/* AI Prompts Accordion */}
                        <div className="space-y-2 pt-1">
                          {/* Veo 3.1 & Sora */}
                          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center gap-1.5">
                                <Sparkles className="w-3 h-3" />
                                Google Veo 3.1 & Sora Промпт (с Character DNA + Style Lock):
                              </span>
                              <button
                                onClick={() => handleCopy(scene.videoPromptVeo, `veo-${i}`)}
                                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `veo-${i}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                <span>Копировать</span>
                              </button>
                            </div>
                            <p className="font-mono text-zinc-300 text-[11px] leading-relaxed bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                              {scene.videoPromptVeo}
                            </p>
                          </div>

                          {/* Higgsfield AI */}
                          <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-mono font-bold text-orange-300 flex items-center gap-1.5">
                                <Camera className="w-3 h-3" />
                                Higgsfield AI Камера & Директива:
                              </span>
                              <button
                                onClick={() => handleCopy(scene.videoPromptHiggsfield, `higgs-${i}`)}
                                className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                {copiedKey === `higgs-${i}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                                <span>Копировать</span>
                              </button>
                            </div>
                            <p className="font-mono text-orange-200/90 text-[11px] leading-relaxed bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                              {scene.videoPromptHiggsfield}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab 2: Beat Sync & Bass Drops */}
              {activeTab === 'beat_sync' && (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Activity className="w-4 h-4 text-violet-400" />
                        Анализ Ритмики & Сетка Монтажных Склеек
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Темп трека: {result.trackAnalysis.bpm} BPM • Длительность бита: {result.trackAnalysis.beatDurationSeconds}s • Такт (4 бита): {result.trackAnalysis.barDurationSeconds}s
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="text-xs font-bold text-violet-300 uppercase">Структура композиции:</span>
                    <p className="text-xs font-mono text-zinc-200">{result.trackAnalysis.structureFlow}</p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-pink-400 uppercase">Ключевые точки дропов (Drop Cues):</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {result.trackAnalysis.bassDropPoints.map((drop, i) => (
                        <div key={i} className="p-3 rounded-xl bg-pink-950/30 border border-pink-800/40 text-xs text-pink-200 font-semibold flex items-center gap-2">
                          <Flame className="w-3.5 h-3.5 text-pink-400" />
                          <span>{drop}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <span className="font-bold text-amber-400 uppercase">Стратегия синхронизации видеоряда:</span>
                    <p className="text-zinc-300 leading-relaxed">{result.trackAnalysis.visualSyncStrategy}</p>
                  </div>
                </div>
              )}

              {/* Tab 3: Character DNA Lock */}
              {activeTab === 'character_lock' && (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-purple-400" />
                        Character Consistency Lock (Постоянство персонажа)
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Seed Token: <strong className="text-purple-300 font-mono">{result.characterDNALock.seedTag}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(result.characterDNALock.masterCharacterPrompt, 'char-dna')}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'char-dna' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Копировать DNA Промпт</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-purple-300 uppercase">Мастер-промпт персонажа для всех нейросетей:</span>
                    <pre className="p-4 rounded-xl bg-zinc-950 border border-purple-900/40 text-purple-200 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {result.characterDNALock.masterCharacterPrompt}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <span className="font-bold text-white">Правила сохранения внешности между кадрами:</span>
                    <ul className="space-y-1.5 text-zinc-300">
                      {result.characterDNALock.consistencyRules.map((rule, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-red-950/20 border border-red-900/40 text-xs space-y-1">
                    <span className="font-bold text-red-400">Negative Prompt для лица (предотвращение деформаций):</span>
                    <p className="font-mono text-zinc-400">{result.characterDNALock.negativePrompt}</p>
                  </div>
                </div>
              )}

              {/* Tab 4: Visual Style Lock */}
              {activeTab === 'style_lock' && (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-400" />
                        Полный Контроль Визуального Стиля (Style Master Lock)
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Единая оптическая схема, освещение и колористика во всех монтажных планах
                      </p>
                    </div>

                    <button
                      onClick={() => handleCopy(result.styleMasterLock.unifiedStylePrompt, 'style-master')}
                      className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedKey === 'style-master' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Копировать Style Lock</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-bold text-pink-300 uppercase">Единый мастер-промпт стиля:</span>
                    <pre className="p-4 rounded-xl bg-zinc-950 border border-pink-900/40 text-pink-200 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                      {result.styleMasterLock.unifiedStylePrompt}
                    </pre>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2 text-xs">
                    <span className="font-bold text-white">Инструкция по цветокоррекции & грейдингу:</span>
                    <p className="text-zinc-300 leading-relaxed">{result.styleMasterLock.colorGradingNotes}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs flex items-center justify-between">
                    <span className="text-zinc-400">Формат кадра клипа:</span>
                    <span className="font-mono font-bold text-white">{result.styleMasterLock.aspectRatio}</span>
                  </div>
                </div>
              )}

              {/* Tab 5: Lip-Sync Pipeline & Production Tips */}
              {activeTab === 'lip_sync_guide' && (
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5 space-y-4 text-xs">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2 border-b border-zinc-800 pb-3">
                    <Mic className="w-4 h-4 text-violet-400" />
                    Пайплайн Синхронизации Губ к Вокалу (Lip-Sync Guide)
                  </h4>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="font-bold text-violet-300 uppercase">1. Технология липсинка (Wav2Lip / LivePortrait):</span>
                    <p className="text-zinc-300 leading-relaxed">{result.productionTips.lipSyncWorkflow}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="font-bold text-purple-300 uppercase">2. Сохранение персонажа в Midjourney / Flux / Veo:</span>
                    <p className="text-zinc-300 leading-relaxed">{result.productionTips.characterConsistencyWorkflow}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                    <span className="font-bold text-emerald-300 uppercase">3. Финальный рендеринг и апскейл 4K 60fps:</span>
                    <p className="text-zinc-300 leading-relaxed">{result.productionTips.renderingRecommendation}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
