import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Disc,
  Play,
  Square,
  Sparkles,
  Sliders,
  Volume2,
  VolumeX,
  Wand2,
  Loader2,
  Download,
  Copy,
  Check,
  RefreshCw,
  Layers,
  Upload,
  Radio,
  FileAudio,
  Cpu,
  ChevronRight,
  Flame,
  Zap
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth.js';

interface RemixStyle {
  id: string;
  name: string;
  sub: string;
  bpm: number;
  drumStyle: 'four_on_floor' | 'trap_808' | 'dnb_stepper' | 'breakbeat';
  gradient: string;
  border: string;
  badge: string;
  description: string;
}

const REMIX_STYLES: RemixStyle[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Synthwave',
    sub: '124 BPM • Аналоговый ретровейв',
    bpm: 124,
    drumStyle: 'four_on_floor',
    gradient: 'from-violet-600 via-fuchsia-600 to-pink-500',
    border: 'border-fuchsia-500/50',
    badge: 'Retro Future',
    description: 'Плотные saw-лиды, неоновый бас, гейтированные реверберации и футуристическая атмосфера.'
  },
  {
    id: 'slap_house',
    name: 'Slap House / EDM',
    sub: '126 BPM • Brazilian Bass',
    bpm: 126,
    drumStyle: 'four_on_floor',
    gradient: 'from-pink-500 via-rose-500 to-red-600',
    border: 'border-pink-500/50',
    badge: 'Club Banger',
    description: 'Короткий упругий 808 плак-бас, пробивная бочка, вокальные чопы и взрывные клубные дропы.'
  },
  {
    id: 'dnb',
    name: 'Drum & Bass',
    sub: '174 BPM • Liquid & Neurofunk',
    bpm: 174,
    drumStyle: 'dnb_stepper',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
    border: 'border-amber-500/50',
    badge: 'High Speed',
    description: 'Скоростной степпер-ритм 174 BPM, глубокий reese-бас, роллинг-хэты и стремительная энергетика.'
  },
  {
    id: 'deep_house',
    name: 'Deep House & Organic',
    sub: '122 BPM • Sunset Vibes',
    bpm: 122,
    drumStyle: 'four_on_floor',
    gradient: 'from-cyan-500 via-teal-500 to-emerald-600',
    border: 'border-cyan-500/50',
    badge: 'Ibiza Sunset',
    description: 'Теплые Rhodes аккорды, мягкая бочка, органический перкуссионный грув и гипнотический вайб.'
  },
  {
    id: 'trap_phonk',
    name: 'Trap & Drift Phonk',
    sub: '140 BPM • 808 Sub & Cowbell',
    bpm: 140,
    drumStyle: 'trap_808',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-700',
    border: 'border-emerald-500/50',
    badge: '808 Distort',
    description: 'Перегруженный скользящий 808-бас, быстрые триольные хай-хэты, ковбеллы и темная мемфис-эстетика.'
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chillhop',
    sub: '85 BPM • Vinyl Warmth',
    bpm: 85,
    drumStyle: 'breakbeat',
    gradient: 'from-purple-500 via-indigo-500 to-blue-600',
    border: 'border-purple-500/50',
    badge: 'Relax & Study',
    description: 'Виниловый треск, детюненные джазовые аккорды гитары, медленный запыленный хип-хоп бит.'
  },
  {
    id: 'techno',
    name: 'Melodic & Peak Techno',
    sub: '132 BPM • Warehouse Acid',
    bpm: 132,
    drumStyle: 'four_on_floor',
    gradient: 'from-yellow-500 via-orange-600 to-red-700',
    border: 'border-yellow-500/50',
    badge: 'Afterlife Peak',
    description: 'Монотонный мощный кик с рамбл-басом, кислотные 303 секвенции и индустриальное эхо.'
  },
  {
    id: 'orchestral',
    name: 'Orchestral Epic Cinema',
    sub: '110 BPM • Hans Zimmer Style',
    bpm: 110,
    drumStyle: 'breakbeat',
    gradient: 'from-blue-600 via-indigo-600 to-violet-800',
    border: 'border-blue-500/50',
    badge: 'Cinematic Score',
    description: 'Масштабные струнные легато, медные духовые, эпические барабаны Taiko и драматический подъем.'
  }
];

interface DemoTrackSource {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string;
  leadNotes: number[];
  bassline: number[];
}

const DEMO_SOURCES: DemoTrackSource[] = [
  {
    id: 'pop-hit',
    title: 'Midnight Starlight (Original)',
    artist: 'Luna Sky',
    genre: 'Pop / Indie Dance',
    bpm: 118,
    key: 'A minor',
    leadNotes: [69, 72, 74, 76, 79, 76, 74, 72],
    bassline: [45, 45, 48, 48, 41, 41, 43, 43]
  },
  {
    id: 'cyber-anthem',
    title: 'Neon Gravity',
    artist: 'Neo Horizon',
    genre: 'Electro Pop',
    bpm: 120,
    key: 'E minor',
    leadNotes: [64, 67, 71, 74, 71, 67, 69, 64],
    bassline: [40, 40, 40, 47, 45, 45, 43, 43]
  },
  {
    id: 'rnb-groove',
    title: 'Velvet Horizon',
    artist: 'Soul Mirage',
    genre: 'R&B / Soul',
    bpm: 95,
    key: 'D minor',
    leadNotes: [62, 65, 69, 72, 70, 69, 65, 62],
    bassline: [38, 38, 38, 45, 41, 41, 43, 43]
  }
];

interface StemControl {
  id: string;
  name: string;
  type: 'vocals' | 'drums' | 'bass' | 'synths' | 'fx';
  volume: number; // 0-100
  pan: number; // -100 to 100
  muted: boolean;
  solo: boolean;
  color: string;
}

export function RemixStudio() {
  const [selectedSource, setSelectedSource] = useState<DemoTrackSource>(DEMO_SOURCES[0]);
  const [selectedStyle, setSelectedStyle] = useState<RemixStyle>(REMIX_STYLES[0]);
  const [targetBpm, setTargetBpm] = useState<number>(REMIX_STYLES[0].bpm);
  const [keyShift, setKeyShift] = useState<number>(0); // -12 to +12 semitones
  const [vibePrompt, setVibePrompt] = useState<string>('Сделай взрывной фестивальный дроп с мощным саб-басом, нарезкой вокала и широкими синтами');
  const [mood, setMood] = useState<string>('Euphoric, Festival Energy');

  // Stems Configuration
  const [stems, setStems] = useState<StemControl[]>([
    { id: 'vocals', name: 'Вокал (Vocals)', type: 'vocals', volume: 90, pan: 0, muted: false, solo: false, color: 'text-pink-400 bg-pink-500/20 border-pink-500/40' },
    { id: 'drums', name: 'Ударные (Drums & Beat)', type: 'drums', volume: 95, pan: 0, muted: false, solo: false, color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' },
    { id: 'bass', name: 'Бас (Bassline & 808)', type: 'bass', volume: 90, pan: 0, muted: false, solo: false, color: 'text-cyan-400 bg-cyan-500/20 border-cyan-500/40' },
    { id: 'synths', name: 'Мелодия & Синты', type: 'synths', volume: 85, pan: 0, muted: false, solo: false, color: 'text-violet-400 bg-violet-500/20 border-violet-500/40' },
    { id: 'fx', name: 'FX & Атмосфера', type: 'fx', volume: 75, pan: 0, muted: false, solo: false, color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' }
  ]);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [remixResult, setRemixResult] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Audio Playback
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Update BPM when style changes
  const handleSelectStyle = (style: RemixStyle) => {
    setSelectedStyle(style);
    setTargetBpm(style.bpm);
  };

  // Toggle Mute / Solo
  const toggleMute = (id: string) => {
    setStems(prev => prev.map(s => s.id === id ? { ...s, muted: !s.muted } : s));
  };

  const toggleSolo = (id: string) => {
    setStems(prev => {
      const willSolo = !prev.find(s => s.id === id)?.solo;
      return prev.map(s => s.id === id ? { ...s, solo: willSolo } : s);
    });
  };

  const setStemVolume = (id: string, vol: number) => {
    setStems(prev => prev.map(s => s.id === id ? { ...s, volume: vol } : s));
  };

  const setStemPan = (id: string, pan: number) => {
    setStems(prev => prev.map(s => s.id === id ? { ...s, pan } : s));
  };

  // Live Audio Playback of Remix
  const togglePlayback = () => {
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      // Calculate active lead and bass notes with key transposition
      const leads = (remixResult?.synthesisSpecs?.leadNotes || selectedSource.leadNotes).map((n: number) => n + keyShift);
      const bass = (remixResult?.synthesisSpecs?.bassline || selectedSource.bassline).map((n: number) => n + keyShift);

      // Check which stems are active
      const hasDrums = stems.find(s => s.id === 'drums')?.muted === false;
      const hasBass = stems.find(s => s.id === 'bass')?.muted === false;

      audioSynth.play({
        title: remixResult?.remixTitle || `${selectedSource.title} (${selectedStyle.name} Remix)`,
        genre: selectedStyle.name,
        bpm: targetBpm,
        leadNotes: leads,
        bassline: hasBass ? bass : [],
        synthParams: {
          filterCutoff: remixResult?.synthesisSpecs?.filterCutoff || 3200,
          oscillatorType: selectedStyle.id === 'lofi' ? 'triangle' : 'sawtooth'
        }
      }, step => {
        setCurrentStep(step);
      });
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      audioSynth.stop();
    };
  }, []);

  // Waveform Canvas Visualization
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const analyser = audioSynth.getAnalyser();
      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height;
          const gradient = ctx.createLinearGradient(0, height, 0, 0);
          gradient.addColorStop(0, '#8b5cf6');
          gradient.addColorStop(0.5, '#ec4899');
          gradient.addColorStop(1, '#06b6d4');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      } else {
        // Idle ambient subtle waveform
        ctx.fillStyle = '#27272a';
        const bars = 48;
        const bWidth = width / bars;
        for (let i = 0; i < bars; i++) {
          const h = 8 + Math.sin(i * 0.4) * 6;
          ctx.fillRect(i * bWidth, (height - h) / 2, bWidth - 2, h);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // AI Remix Generation Call
  const handleGenerateRemix = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        trackTitle: selectedSource.title,
        artistName: selectedSource.artist,
        originalGenre: selectedSource.genre,
        targetStyle: selectedStyle.name,
        originalBpm: selectedSource.bpm,
        targetBpm: targetBpm,
        keyShift: keyShift,
        mood: mood,
        stemsConfig: stems,
        vibePrompt: vibePrompt
      };

      const res = await fetch('/api/gen/remix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setRemixResult(data);
    } catch (err) {
      console.error('Failed to generate remix:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.warn('Copy issue:', e);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-950 via-zinc-900 to-fuchsia-950 border border-violet-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/40 flex items-center gap-1.5">
                <Disc className="w-3.5 h-3.5 animate-spin" /> AI Music Remix Studio
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                Любой стиль & Стем-сепарация
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Студия Создания Ремиксов
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Превратите любую песню, вокальную дорожку или трек в полноценный ремикс в любом жанре: от клубного Slap House и киберпанк Synthwave до скоростного Drum & Bass и глубокого Melodic Techno.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateRemix}
              disabled={isGenerating}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white font-bold text-sm shadow-xl shadow-fuchsia-600/25 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Трансформация в ремикс...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Сгенерировать AI Ремикс</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Track Input & Style Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Source Track & Settings (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Source Song Selection */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-violet-400" /> Исходный трек / Песня
              </h2>
              <span className="text-xs text-zinc-400">Выберите или загрузите</span>
            </div>

            <div className="space-y-2">
              {DEMO_SOURCES.map(source => (
                <button
                  key={source.id}
                  onClick={() => setSelectedSource(source)}
                  className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    selectedSource.id === source.id
                      ? 'bg-violet-950/40 border-violet-500 text-white shadow-md'
                      : 'bg-zinc-950/40 border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-100">{source.title}</p>
                    <p className="text-[11px] text-zinc-400">{source.artist} • {source.genre}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-violet-300">
                      {source.bpm} BPM • {source.key}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <label className="flex items-center justify-center gap-2 w-full p-3 rounded-2xl border border-dashed border-zinc-700 hover:border-violet-500 text-xs text-zinc-400 hover:text-violet-300 cursor-pointer transition-all bg-zinc-950/20">
              <Upload className="w-4 h-4" />
              <span>Загрузить собственный аудиофайл (MP3 / WAV)</span>
              <input
                type="file"
                accept="audio/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const customTrack: DemoTrackSource = {
                      id: `custom-${Date.now()}`,
                      title: file.name.replace(/\.[^/.]+$/, ''),
                      artist: 'Пользовательский трек',
                      genre: 'Custom Audio',
                      bpm: 120,
                      key: 'Detected Am',
                      leadNotes: [69, 72, 74, 76, 79, 76, 74, 72],
                      bassline: [45, 45, 48, 48, 41, 41, 43, 43]
                    };
                    setSelectedSource(customTrack);
                  }
                }}
              />
            </label>
          </div>

          {/* Tempo & Key Transformation Sliders */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-pink-400" /> Параметры трансформации
            </h2>

            {/* Target BPM */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Целевой темп ремикса (BPM):</span>
                <span className="font-mono font-bold text-violet-400">{targetBpm} BPM</span>
              </div>
              <input
                type="range"
                min="70"
                max="180"
                value={targetBpm}
                onChange={e => setTargetBpm(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>70 (Slow/Trap)</span>
                <span>124-128 (House/EDM)</span>
                <span>174 (D&B)</span>
              </div>
            </div>

            {/* Key Transpose */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400">Сдвиг тональности (Key Pitch Shift):</span>
                <span className="font-mono font-bold text-fuchsia-400">
                  {keyShift > 0 ? `+${keyShift} полутонов` : keyShift < 0 ? `${keyShift} полутонов` : 'Без сдвига (0)'}
                </span>
              </div>
              <input
                type="range"
                min="-12"
                max="12"
                value={keyShift}
                onChange={e => setKeyShift(Number(e.target.value))}
                className="w-full accent-fuchsia-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
                <span>-12 (Октава вниз)</span>
                <span>0 (Оригинал)</span>
                <span>+12 (Октава вверх)</span>
              </div>
            </div>

            {/* Custom Vibe Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs text-zinc-400">Индивидуальные пожелания к ремиксу:</label>
              <textarea
                value={vibePrompt}
                onChange={e => setVibePrompt(e.target.value)}
                rows={2}
                placeholder="Например: добавь агрессивный бас в дропе, срез вокала на 1/8 такта, виниловый скретч перед ямой..."
                className="w-full p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-700/80 text-xs text-zinc-200 focus:outline-none focus:border-violet-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Style Selector Grid (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-fuchsia-400" /> Целевой стиль ремикса
              </h2>
              <p className="text-xs text-zinc-400">Выберите жанр для полного переосмысления звучания</p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300">
              8 стилей
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {REMIX_STYLES.map(style => {
              const isSelected = selectedStyle.id === style.id;
              return (
                <div
                  key={style.id}
                  onClick={() => handleSelectStyle(style)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                    isSelected
                      ? `bg-zinc-900 border-2 ${style.border} shadow-lg shadow-fuchsia-500/10 scale-[1.01]`
                      : 'bg-zinc-950/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-bold text-white group-hover:text-fuchsia-300 transition-colors">
                        {style.name}
                      </h3>
                      <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{style.sub}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-zinc-800/80 border border-zinc-700/60 text-zinc-300 whitespace-nowrap">
                      {style.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-2 leading-tight">
                    {style.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stem Separation & Multi-Track Mixer Console */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-violet-400" /> Консоль Стемов (Stem Separation Mixer)
            </h2>
            <p className="text-xs text-zinc-400">
              Управление отдельными аудиодорожками: Вокал, Ударные, Бас, Мелодия и Спецэффекты с индивидуальным балансом
            </p>
          </div>

          {/* Master Preview Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayback}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                isPlaying
                  ? 'bg-rose-600 text-white shadow-rose-600/30'
                  : 'bg-emerald-600 text-white shadow-emerald-600/30 hover:bg-emerald-500'
              }`}
            >
              {isPlaying ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Остановить воспроизведение</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Слушать ремикс ({selectedStyle.name})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-Time Waveform Visualizer Canvas */}
        <div className="relative w-full h-20 bg-zinc-950 rounded-2xl border border-zinc-800/80 overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} width={800} height={80} className="w-full h-full" />
          <div className="absolute top-2 left-3 flex items-center gap-2 pointer-events-none">
            <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">
              {isPlaying ? `Playing: ${targetBpm} BPM • Step ${currentStep + 1}/32` : 'Visualizer Ready'}
            </span>
          </div>
        </div>

        {/* 5 Stem Channels */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {stems.map(stem => (
            <div
              key={stem.id}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                stem.muted
                  ? 'bg-zinc-950/40 border-zinc-800 opacity-60'
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${stem.color}`}>
                  {stem.name}
                </span>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Громкость:</span>
                  <span className="font-mono font-bold text-zinc-200">{stem.volume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stem.volume}
                  onChange={e => setStemVolume(stem.id, Number(e.target.value))}
                  className="w-full accent-violet-500 cursor-pointer"
                />
              </div>

              {/* Pan Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-zinc-400">
                  <span>Панорама (Pan):</span>
                  <span className="font-mono text-zinc-300">
                    {stem.pan === 0 ? 'C' : stem.pan < 0 ? `${Math.abs(stem.pan)}L` : `${stem.pan}R`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={stem.pan}
                  onChange={e => setStemPan(stem.id, Number(e.target.value))}
                  className="w-full accent-fuchsia-500 cursor-pointer"
                />
              </div>

              {/* Mute & Solo Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => toggleMute(stem.id)}
                  className={`flex-1 py-1 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    stem.muted
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  MUTE
                </button>
                <button
                  onClick={() => toggleSolo(stem.id)}
                  className={`flex-1 py-1 rounded-xl text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    stem.solo
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  SOLO
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Generated AI Remix Results Section */}
      {remixResult && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30">
                  AI Remix Master
                </span>
                <span className="text-xs font-mono text-zinc-400">{remixResult.camelotKey}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {remixResult.remixTitle}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {remixResult.originalArtist} • {remixResult.targetGenre} • {remixResult.targetBpm} BPM
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(remixResult, null, 2), 'full-json')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {copiedKey === 'full-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'full-json' ? 'Скопировано!' : 'Экспорт JSON'}</span>
            </button>
          </div>

          {/* Remix Concept */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 space-y-2">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-fuchsia-400" /> Концепция переосмысления и саунд-дизайн
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {remixResult.remixConcept}
            </p>
          </div>

          {/* Stem Transformations Breakdown */}
          {remixResult.stemTransformations && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Трансформация отдельных партий
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(remixResult.stemTransformations).map(([stemKey, desc]) => (
                  <div key={stemKey} className="p-3.5 rounded-2xl bg-zinc-950/40 border border-zinc-800 space-y-1">
                    <p className="text-[11px] font-bold text-violet-300 capitalize">{stemKey}</p>
                    <p className="text-xs text-zinc-400 leading-tight">{String(desc)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Arrangement Timeline */}
          {remixResult.structure && Array.isArray(remixResult.structure) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Структура и кривая энергии ремикса
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                {remixResult.structure.map((sec: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-1.5 text-center">
                    <span className="text-[10px] font-bold text-zinc-400">{sec.section}</span>
                    <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-violet-500 to-fuchsia-500 h-full rounded-full"
                        style={{ width: `${sec.energy}%` }}
                      />
                    </div>
                    <p className="text-[10px] font-mono text-fuchsia-300 font-bold">{sec.energy}% Energy</p>
                    <p className="text-[9px] text-zinc-500">{sec.bars} Bars</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Prompts for Music Engines (Suno, Udio, Google Lyria / Flow Music, AI Nano Music) */}
          {remixResult.prompts && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Готовые промпты для AI Генераторов Музыки
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Suno Prompt */}
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300">Suno AI Prompt</span>
                    <button
                      onClick={() => copyToClipboard(remixResult.prompts.sunoPrompt, 'suno')}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'suno' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'suno' ? 'Скопировано' : 'Копировать'}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl select-all">
                    {remixResult.prompts.sunoPrompt}
                  </p>
                </div>

                {/* Udio Prompt */}
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">Udio AI Prompt</span>
                    <button
                      onClick={() => copyToClipboard(remixResult.prompts.udioPrompt, 'udio')}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'udio' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'udio' ? 'Скопировано' : 'Копировать'}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl select-all">
                    {remixResult.prompts.udioPrompt}
                  </p>
                </div>

                {/* Flow Music Lyria */}
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-fuchsia-300">Flow Music (Google Lyria)</span>
                    <button
                      onClick={() => copyToClipboard(remixResult.prompts.flowMusicLyria, 'flow')}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'flow' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'flow' ? 'Скопировано' : 'Копировать'}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl select-all">
                    {remixResult.prompts.flowMusicLyria}
                  </p>
                </div>

                {/* AI Nano Music */}
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300">AI Nano Music (Awards entry)</span>
                    <button
                      onClick={() => copyToClipboard(remixResult.prompts.aiNanoMusic, 'nano')}
                      className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === 'nano' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'nano' ? 'Скопировано' : 'Копировать'}</span>
                    </button>
                  </div>
                  <p className="text-xs font-mono text-zinc-300 bg-zinc-900/60 p-2.5 rounded-xl select-all">
                    {remixResult.prompts.aiNanoMusic}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DAW Production Notes */}
          {remixResult.dawProductionNotes && (
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800 space-y-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Советы по сведению и продакшну в DAW (Ableton / FL Studio)
              </h3>
              <ul className="space-y-1 text-xs text-zinc-400">
                {remixResult.dawProductionNotes.map((note: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-violet-400 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
