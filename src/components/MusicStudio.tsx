import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Music,
  Play,
  Square,
  Sparkles,
  Volume2,
  Wand2,
  Loader2,
  Download,
  Mic,
  Radio,
  Disc,
  ExternalLink,
  Layers,
  FileText,
  Sliders,
  Check,
  Copy,
  Trophy,
  Coins,
  Flame,
  Award,
  Heart,
  Share2,
  Video,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import { audioSynth, MusicTrackSpec } from '../utils/audioSynth.js';

export type StudioEngine = 'ainanomusic' | 'flowmusic' | 'treblo' | 'synth';

interface PlatformInfo {
  id: StudioEngine;
  name: string;
  badge: string;
  url: string;
  tagline: string;
  gradient: string;
  borderActive: string;
  accentText: string;
  bgBadge: string;
  icon: React.ElementType;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: 'ainanomusic',
    name: 'AI Nano Music',
    badge: 'ainanomusic.com',
    url: 'https://ainanomusic.com',
    tagline: 'AI Конкурсы, сообщество и Nano (XNO) награды авторам',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    borderActive: 'border-emerald-500',
    accentText: 'text-emerald-400',
    bgBadge: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
    icon: Coins
  },
  {
    id: 'flowmusic',
    name: 'Flow Music',
    badge: 'flowmusic.app',
    url: 'https://www.flowmusic.app',
    tagline: 'Google DeepMind Lyria 3 Pro, SynthID & Veo видео',
    gradient: 'from-cyan-500 via-blue-600 to-indigo-600',
    borderActive: 'border-cyan-500',
    accentText: 'text-cyan-400',
    bgBadge: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
    icon: Flame
  },
  {
    id: 'treblo',
    name: 'Treblo AI',
    badge: 'treblo.com',
    url: 'https://treblo.com',
    tagline: 'Treblo Melodia 2.0 вокальный синтез, аккорды и стемы',
    gradient: 'from-violet-600 via-purple-600 to-fuchsia-600',
    borderActive: 'border-violet-500',
    accentText: 'text-violet-400',
    bgBadge: 'bg-violet-500/10 border-violet-500/30 text-violet-300',
    icon: Mic
  },
  {
    id: 'synth',
    name: 'Genesis Synth',
    badge: 'Web Audio Engine',
    url: '',
    tagline: 'Процедурный полифонический синтезатор в браузере',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    borderActive: 'border-amber-500',
    accentText: 'text-amber-400',
    bgBadge: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    icon: Sliders
  }
];

const GENRES = [
  { id: 'synthwave', label: 'Synthwave', desc: 'Ретро-вейв, 80-е, неоновые синтезаторы' },
  { id: 'indie_pop', label: 'Indie Pop', desc: 'Живой вокал, гитары, мелодичный хук' },
  { id: 'phonk', label: 'Drift Phonk / Trap', desc: 'Глубокий 808 бас, каубелл, плотный бит' },
  { id: 'lofi', label: 'Lo-Fi Chill', desc: 'Теплый винил, спокойный джазовый ритм' },
  { id: 'cyberpunk', label: 'Cyberpunk Electro', desc: 'Агрессивный бас, тяжелый бит, дистопия' },
  { id: 'ambient', label: 'Ambient Drone', desc: 'Глубокие текстуры, космическая медитация' },
  { id: 'orchestral', label: 'Epic Cinematic', desc: 'Симфонический драматизм, струнные' },
  { id: 'deephouse', label: 'Deep Melodic House', desc: 'Клубный грув, мягкий бас и пэды' }
];

const AI_NANO_CONTESTS = [
  { id: 'c1', title: 'Cyberpunk Night City • Конкурс месяца', pool: '1,500 XNO (~$1,800)', deadline: 'Осталось 5 дней', genre: 'cyberpunk' },
  { id: 'c2', title: 'Lo-Fi Study Beats • Nano Ambient', pool: '850 XNO (~$1,020)', deadline: 'Осталось 12 дней', genre: 'lofi' },
  { id: 'c3', title: 'Retrowave 80s Turbo • Synth Horizon', pool: '1,200 XNO (~$1,440)', deadline: 'Осталось 18 дней', genre: 'synthwave' },
  { id: 'c4', title: 'Bass Arena & Phonk Rush', pool: '2,000 XNO (~$2,400)', deadline: 'Новый этап', genre: 'phonk' }
];

const TREBLO_VOCALISTS = [
  { id: 'Fenrir', label: 'Мужской (Глубокий)', desc: 'Бархатный мужской тембр' },
  { id: 'Kore', label: 'Женский (Мелодичный)', desc: 'Чистый эмоциональный поп-вокал' },
  { id: 'Puck', label: 'Энергичный (Яркий)', desc: 'Драйвовый и звонкий вокал' },
  { id: 'Zephyr', label: 'Атмосферный (Инди)', desc: 'Мягкий воздушный вокал' }
];

const MOODS = [
  'Энергичный', 'Меланхоличный', 'Мистический', 'Эйфорический', 'Спокойный', 'Кинематографичный'
];

const MUSIC_IDEAS = [
  'Ночная поездка по залитому дождем Токио на спорткаре 80-х',
  'Погружение исследовательской субмарины в глубины Марианской впадины',
  'Взлет ракеты на орбиту Марса с видом на рассветное солнце',
  'Уютное кафе в Париже дождливым воскресным утром'
];

const SAMPLE_LYRICS = `[Verse 1]
Neon shadows on the wet pavement
Driving through the digital rain
Every heartbeat is an echo of time
Breaking through the static and pain

[Chorus]
We are electric, we are alive
Chasing the pulse in the neon night
Hold on to the frequency now
We'll never turn the volume down

[Outro]
Fade into the starlight...`;

export const MusicStudio: React.FC = () => {
  const [engine, setEngine] = useState<StudioEngine>('ainanomusic');
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('synthwave');
  const [mood, setMood] = useState('Энергичный');
  const [bpm, setBpm] = useState(124);
  const [vocalist, setVocalist] = useState('Fenrir');
  const [selectedContest, setSelectedContest] = useState(AI_NANO_CONTESTS[0]);
  const [useCustomLyrics, setUseCustomLyrics] = useState(false);
  const [customLyrics, setCustomLyrics] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrackSpec | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExportingWav, setIsExportingWav] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);
  const [copiedVeoPrompt, setCopiedVeoPrompt] = useState(false);
  const [copiedSubmission, setCopiedSubmission] = useState(false);
  const [votesCount, setVotesCount] = useState(184);
  const [hasVoted, setHasVoted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const activePlatform = PLATFORMS.find(p => p.id === engine) || PLATFORMS[0];

  const handleSurpriseMe = () => {
    const randomIdea = MUSIC_IDEAS[Math.floor(Math.random() * MUSIC_IDEAS.length)];
    const randomGenre = GENRES[Math.floor(Math.random() * GENRES.length)].id;
    const randomMood = MOODS[Math.floor(Math.random() * MOODS.length)];
    const randomBpm = Math.floor(Math.random() * 40) + 100;
    const randomVocal = TREBLO_VOCALISTS[Math.floor(Math.random() * TREBLO_VOCALISTS.length)].id;

    setPrompt(randomIdea);
    setGenre(randomGenre);
    setMood(randomMood);
    setBpm(randomBpm);
    setVocalist(randomVocal);
  };

  const handleDownloadWav = async () => {
    if (!currentTrack || isExportingWav) return;
    setIsExportingWav(true);
    try {
      const blob = await audioSynth.exportWav(currentTrack, 16);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentTrack.title.toLowerCase().replace(/\s+/g, '-')}-audio.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export wav:', err);
      setError('Не удалось экспортировать WAV файл');
    } finally {
      setIsExportingWav(false);
    }
  };

  // Real-time canvas audio visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const analyser = audioSynth.getAnalyser();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyser && isPlaying) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        const barWidth = (canvas.width / (bufferLength / 2)) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength / 2; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;

          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          if (engine === 'ainanomusic') {
            gradient.addColorStop(0, '#10b981');
            gradient.addColorStop(0.5, '#14b8a6');
            gradient.addColorStop(1, '#06b6d4');
          } else if (engine === 'flowmusic') {
            gradient.addColorStop(0, '#06b6d4');
            gradient.addColorStop(0.5, '#3b82f6');
            gradient.addColorStop(1, '#8b5cf6');
          } else {
            gradient.addColorStop(0, '#8b5cf6');
            gradient.addColorStop(0.5, '#ec4899');
            gradient.addColorStop(1, '#f59e0b');
          }

          ctx.fillStyle = gradient;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

          x += barWidth + 1;
        }
      } else {
        // Idle pulsing wave
        ctx.strokeStyle = engine === 'ainanomusic' ? '#065f46' : engine === 'flowmusic' ? '#1e3a8a' : '#3f3f46';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const sliceWidth = canvas.width / 50;
        let x = 0;
        for (let i = 0; i < 50; i++) {
          const y = canvas.height / 2 + Math.sin(i * 0.2 + Date.now() * 0.003) * 6;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
        ctx.stroke();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, engine]);

  const handleEnhance = async () => {
    if (!prompt.trim()) return;
    setIsEnhancing(true);
    setError(null);
    try {
      const res = await fetch('/api/gen/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, type: `music track for ${activePlatform.name}` })
      });
      const data = await res.json();
      if (data.enhancedPrompt) setPrompt(data.enhancedPrompt);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() && !customLyrics.trim()) return;
    if (isGenerating) return;

    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/gen/music', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: engine === 'ainanomusic' ? `[AI Nano Contest: ${selectedContest.title}] ${prompt}` : prompt,
          genre,
          mood,
          bpm,
          engine,
          trebloMode: engine === 'treblo',
          vocalistVoice: vocalist,
          customLyrics: useCustomLyrics ? customLyrics : ''
        })
      });

      const track = await res.json();
      if (!res.ok) throw new Error(track.error || 'Ошибка при синтезе музыки');

      setCurrentTrack(track);
      setVotesCount(track.aiNanoDetails?.votesCount || 184);
      setHasVoted(false);
      audioSynth.play(track, step => setCurrentStep(step));
      setIsPlaying(true);
    } catch (err: any) {
      setError(err.message || 'Ошибка генерации музыки');
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlay = () => {
    if (!currentTrack) return;
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      audioSynth.play(currentTrack, step => setCurrentStep(step));
      setIsPlaying(true);
    }
  };

  const handleCopyLyrics = () => {
    if (!currentTrack?.lyrics) return;
    navigator.clipboard.writeText(currentTrack.lyrics);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  const handleCopyVeoPrompt = () => {
    if (!currentTrack?.flowMusicDetails?.veoVideoPrompt) return;
    navigator.clipboard.writeText(currentTrack.flowMusicDetails.veoVideoPrompt);
    setCopiedVeoPrompt(true);
    setTimeout(() => setCopiedVeoPrompt(false), 2000);
  };

  const handleCopyContestSubmission = () => {
    if (!currentTrack) return;
    const text = `🎵 Track Title: ${currentTrack.title}\nGenre: ${currentTrack.genre}\nBPM: ${currentTrack.bpm}\nContest: ${selectedContest.title}\nAI Engine: ${activePlatform.name}\nSubmission: https://ainanomusic.com\n\nLyrics:\n${currentTrack.lyrics || 'Instrumental Track'}`;
    navigator.clipboard.writeText(text);
    setCopiedSubmission(true);
    setTimeout(() => setCopiedSubmission(false), 2000);
  };

  const handleVote = () => {
    if (hasVoted) return;
    setVotesCount(prev => prev + 1);
    setHasVoted(true);
  };

  return (
    <div className="space-y-6">
      {/* Top AI Music Ecosystem Hub */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white shadow-sm">
                AI Music Multi-Platform Hub
              </span>
              <span className="text-xs text-zinc-400 font-mono">v3.8 Unified Sound</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Музыкальные ИИ Платформы и Генераторы
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Создавайте треки для конкурсов <strong className="text-emerald-400">AI Nano Music</strong> (ainanomusic.com), работайте с <strong className="text-cyan-400">Google Flow Music</strong> (flowmusic.app) и <strong className="text-violet-400">Treblo</strong> (treblo.com).
            </p>
          </div>

          {/* Quick Direct Links */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://ainanomusic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Перейти на платформу AI Nano Music"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>ainanomusic.com</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
            <a
              href="https://www.flowmusic.app"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Перейти на платформу Flow Music"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>flowmusic.app</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
            <a
              href="https://treblo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-violet-950/40 hover:bg-violet-900/50 border border-violet-500/40 text-violet-300 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              title="Перейти на платформу Treblo"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>treblo.com</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-70" />
            </a>
          </div>
        </div>

        {/* Engine Switcher Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {PLATFORMS.map(p => {
            const isSelected = engine === p.id;
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setEngine(p.id)}
                className={`text-left p-3.5 rounded-2xl border transition-all relative overflow-hidden group ${
                  isSelected
                    ? `${p.borderActive} bg-zinc-900/90 shadow-lg shadow-black/40 ring-1 ${p.borderActive}`
                    : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-700 text-zinc-400'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-xl bg-zinc-900 ${p.accentText}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  {p.url && (
                    <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-300 transition-colors">
                      {p.badge}
                    </span>
                  )}
                </div>
                <div className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                  {p.name}
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                </div>
                <div className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                  {p.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Input Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            {/* Header & Active Engine Badge */}
            <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${activePlatform.bgBadge}`}>
                  <activePlatform.icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-zinc-100">{activePlatform.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activePlatform.bgBadge}`}>
                      {activePlatform.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{activePlatform.tagline}</p>
                </div>
              </div>

              {activePlatform.url && (
                <a
                  href={activePlatform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl border border-zinc-700/60 transition-colors flex items-center gap-1 text-xs shrink-0"
                  title={`Открыть ${activePlatform.badge} в новой вкладке`}
                >
                  <span className="hidden sm:inline text-[11px] font-medium">Портал</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Special Mode 1: AI Nano Music Contest Picker */}
              {engine === 'ainanomusic' && (
                <div className="space-y-2.5 p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Ежемесячный конкурс AI Nano Music:</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-300/80">Nano XNO Feeless</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {AI_NANO_CONTESTS.map(c => {
                      const isChosen = selectedContest.id === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedContest(c);
                            setGenre(c.genre);
                          }}
                          className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                            isChosen
                              ? 'bg-emerald-900/30 border-emerald-500 text-white font-medium'
                              : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-zinc-200 font-semibold">{c.title}</span>
                            <span className="text-[10px] text-emerald-400 font-mono font-bold">{c.pool}</span>
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">{c.deadline}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Economy Breakdown Info */}
                  <div className="p-2.5 bg-zinc-950/80 rounded-xl border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                    <div className="flex items-center justify-between text-zinc-300 font-medium">
                      <span>Распределение наград Nano (XNO):</span>
                      <span className="text-emerald-400">0% комиссия сети</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 text-[10px] text-center pt-1">
                      <div className="p-1 bg-zinc-900 rounded">50% Фонд</div>
                      <div className="p-1 bg-emerald-950/50 text-emerald-300 rounded font-semibold">20% Автору</div>
                      <div className="p-1 bg-zinc-900 rounded">10% Куратор</div>
                      <div className="p-1 bg-zinc-900 rounded">20% Платформа</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Mode 2: Flow Music (Google DeepMind Lyria 3 & SynthID) */}
              {engine === 'flowmusic' && (
                <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Google DeepMind Lyria 3 Pro Engine</span>
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
                      SynthID™ Включен
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Движок Flow Music генерирует студийные треки с цифровым водяным знаком SynthID и синхронизированным сценарием для Google Veo AI видео.
                  </p>
                </div>
              )}

              {/* Special Mode 3: Treblo Custom Lyrics Mode Switch */}
              {engine === 'treblo' && (
                <div className="flex items-center justify-between p-2.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl text-xs">
                  <span className="text-zinc-300 font-medium">Режим генерации слов:</span>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUseCustomLyrics(false)}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        !useCustomLyrics ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      ИИ-текст
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setUseCustomLyrics(true);
                        if (!customLyrics) setCustomLyrics(SAMPLE_LYRICS);
                      }}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        useCustomLyrics ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Свои стихи
                    </button>
                  </div>
                </div>
              )}

              {/* Prompt textarea or Custom Lyrics */}
              {useCustomLyrics && engine === 'treblo' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                      Текст песни (со структурой Treblo)
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomLyrics(SAMPLE_LYRICS)}
                      className="text-xs text-violet-400 hover:text-violet-300"
                    >
                      Вставить пример
                    </button>
                  </div>
                  <textarea
                    value={customLyrics}
                    onChange={e => setCustomLyrics(e.target.value)}
                    placeholder="[Verse 1]&#10;Ваши слова...&#10;&#10;[Chorus]&#10;Припев..."
                    rows={6}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/50 rounded-2xl p-4 text-xs font-mono text-zinc-100 placeholder-zinc-500 transition-all outline-none resize-none"
                  />
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                      {engine === 'ainanomusic'
                        ? 'Концепция конкурсного трека (AI Nano)'
                        : engine === 'flowmusic'
                        ? 'Запрос для Flow Music & Lyria 3'
                        : 'Музыкальная концепция трека'}
                    </label>
                    <button
                      type="button"
                      onClick={handleEnhance}
                      disabled={!prompt.trim() || isEnhancing || isGenerating}
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40 transition-colors"
                    >
                      {isEnhancing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5" />
                      )}
                      <span>Улучшить с ИИ</span>
                    </button>
                  </div>
                  <textarea
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder={
                      engine === 'ainanomusic'
                        ? 'Опишите трек для победы в конкурсе (например: футуристичный киберпанк синтвейв с плотным 808 басом, ярким вокалом и космическим дропом)...'
                        : engine === 'flowmusic'
                        ? 'Промпт для Google Flow Music (например: кинематографичный инди-поп саундтрек для заката с теплым аналоговым битом)...'
                        : 'Опишите настроение, ритм, атмосферу (например: динамичный синтвейв для ночной гонки с мощной бочкой)...'
                    }
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 rounded-2xl p-4 text-sm text-zinc-100 placeholder-zinc-500 transition-all outline-none resize-none"
                  />
                </div>
              )}

              {/* Vocalist Selection for Treblo */}
              {engine === 'treblo' && (
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2">
                    Тип вокалиста (Treblo AI Voice)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {TREBLO_VOCALISTS.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setVocalist(v.id)}
                        className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                          vocalist === v.id
                            ? 'bg-violet-950/40 border-violet-500 text-white font-semibold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-zinc-200">{v.label}</div>
                        <div className="text-[10px] text-zinc-500">{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Prompts */}
              {!useCustomLyrics && (
                <div>
                  <span className="text-[11px] text-zinc-500 block mb-2 font-medium">Быстрые идеи:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {MUSIC_IDEAS.map((idea, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPrompt(idea)}
                        className="text-[11px] px-2.5 py-1 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-700/40 rounded-lg transition-colors truncate max-w-[260px]"
                      >
                        {idea}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Genre Grid */}
              <div>
                <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2.5">
                  Жанр и стиль композиции
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {GENRES.map(g => {
                    const isActive = genre === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGenre(g.id)}
                        className={`text-left p-3 rounded-2xl border transition-all ${
                          isActive
                            ? `${activePlatform.borderActive} bg-zinc-900/90 text-zinc-100 shadow-lg shadow-black/30`
                            : 'bg-zinc-950/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <div className="text-xs font-semibold text-zinc-200">{g.label}</div>
                        <div className="text-[10px] text-zinc-500 line-clamp-1">{g.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Mood & BPM */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium uppercase tracking-wider text-zinc-400 block mb-2">
                    Настроение
                  </label>
                  <select
                    value={mood}
                    onChange={e => setMood(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 outline-none focus:border-emerald-500"
                  >
                    {MOODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                      Темп: {bpm} BPM
                    </label>
                  </div>
                  <input
                    type="range"
                    min="70"
                    max="160"
                    value={bpm}
                    onChange={e => setBpm(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-950/50 border border-red-500/30 rounded-xl text-red-300 text-xs">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSurpriseMe}
                  className="px-3.5 py-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-2xl text-xs font-semibold flex items-center justify-center transition-colors"
                  title="Случайный стиль и тема"
                >
                  🎲
                </button>
                <button
                  type="submit"
                  disabled={(!prompt.trim() && !customLyrics.trim()) || isGenerating}
                  className={`flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r ${activePlatform.gradient} hover:opacity-95 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer`}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Генерация трека ({activePlatform.name})...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Сгенерировать в {activePlatform.name}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Music Player, Stems & Multi-Platform Integration View */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${activePlatform.gradient} flex items-center justify-center shadow-lg ${isPlaying ? 'animate-pulse' : ''}`}>
                  <Disc className={`w-6 h-6 text-white ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-semibold text-zinc-100">
                      {currentTrack ? currentTrack.title : `${activePlatform.name} Studio`}
                    </h4>
                    {currentTrack?.flowMusicDetails?.synthIdVerified && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950 border border-cyan-500/40 text-cyan-300">
                        SynthID
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">
                    {currentTrack
                      ? `${currentTrack.genre.toUpperCase()} • ${currentTrack.bpm} BPM • ${currentTrack.mood || mood}`
                      : 'Ожидание запуска генерации'}
                  </p>
                </div>
              </div>

              {currentTrack && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadWav}
                    disabled={isExportingWav}
                    className="px-3.5 py-2.5 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer border border-zinc-700/60"
                    title="Скачать WAV аудиофайл"
                  >
                    {isExportingWav ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Экспорт...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Скачать WAV</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={togglePlay}
                    className="px-5 py-2.5 rounded-2xl bg-zinc-100 hover:bg-white text-zinc-950 font-semibold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-4 h-4 fill-zinc-950" />
                        <span>Пауза</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-zinc-950" />
                        <span>Слушать трек</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Interactive Spectrum Canvas */}
            <div className="relative rounded-2xl bg-zinc-950 border border-zinc-800/80 p-4 overflow-hidden mb-6">
              <canvas
                ref={canvasRef}
                width={640}
                height={160}
                className="w-full h-40 block"
              />
              {isPlaying && (
                <div className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] bg-zinc-950/90 border ${activePlatform.borderActive} ${activePlatform.accentText}`}>
                  <Radio className="w-3 h-3 animate-ping" />
                  <span>{activePlatform.name.toUpperCase()} AUDIO STREAM</span>
                </div>
              )}
            </div>

            {currentTrack ? (
              <div className="space-y-4">
                {/* AI Nano Contest Badge & Upvote Bar */}
                {engine === 'ainanomusic' && (
                  <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white">
                          {currentTrack.aiNanoDetails?.contestCategory || selectedContest.title}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Фонд конкурса: <strong className="text-emerald-300">{currentTrack.aiNanoDetails?.prizePoolXno || selectedContest.pool}</strong> • Прямая выплата автору: 20% в Nano (XNO)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleVote}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          hasVoted
                            ? 'bg-rose-500 text-white border-rose-400'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-white' : 'text-rose-400'}`} />
                        <span>{votesCount} Голосов</span>
                      </button>

                      <a
                        href="https://ainanomusic.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-md"
                      >
                        <span>ainanomusic.com</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Flow Music Lyria & Veo Companion Prompt */}
                {engine === 'flowmusic' && currentTrack.flowMusicDetails?.veoVideoPrompt && (
                  <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs font-semibold text-cyan-300">
                        <Video className="w-4 h-4 text-cyan-400" />
                        <span>Сценарий для Google Veo AI клипа (Flow Music):</span>
                      </div>
                      <button
                        onClick={handleCopyVeoPrompt}
                        className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                      >
                        {copiedVeoPrompt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Копировать промпт Veo</span>
                      </button>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 font-mono">
                      {currentTrack.flowMusicDetails.veoVideoPrompt}
                    </p>
                  </div>
                )}

                {/* Tags Strip */}
                {currentTrack.trebloTags && currentTrack.trebloTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold mr-1">
                      Теги трека:
                    </span>
                    {currentTrack.trebloTags.map((tag, i) => (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-mono border ${activePlatform.bgBadge}`}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                {currentTrack.description && (
                  <div className="p-3.5 bg-zinc-950/50 rounded-2xl border border-zinc-800 text-xs text-zinc-300 leading-relaxed">
                    <span className={`font-semibold ${activePlatform.accentText}`}>Саунд-дизайн: </span>
                    {currentTrack.description}
                  </div>
                )}

                {/* Stems Section */}
                {currentTrack.stems && currentTrack.stems.length > 0 && (
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                        <Layers className={`w-3.5 h-3.5 ${activePlatform.accentText}`} />
                        <span>Стемы трека (Lossless Audio Channels):</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">4 канала сведено</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {currentTrack.stems.map((stem, i) => (
                        <div
                          key={i}
                          className="p-2.5 bg-zinc-900/80 border border-zinc-800/80 rounded-xl text-center"
                        >
                          <span className="text-xs font-bold text-zinc-200 block mb-0.5">{stem.name}</span>
                          <span className="text-[10px] text-zinc-500 line-clamp-1">{stem.type}</span>
                          <div className="mt-2 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <div className={`h-full w-3/4 ${engine === 'ainanomusic' ? 'bg-emerald-500' : engine === 'flowmusic' ? 'bg-cyan-500' : 'bg-violet-500'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Musical Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/70">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Тональность</span>
                    <span className={`text-sm font-bold ${activePlatform.accentText}`}>{currentTrack.key || 'A minor'}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/70">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Синтезатор</span>
                    <span className="text-sm font-bold text-pink-400 capitalize">{currentTrack.synthParams?.oscillatorType || 'Sawtooth'}</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/70">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Срез фильтра</span>
                    <span className="text-sm font-bold text-amber-400">{currentTrack.synthParams?.filterCutoff || 2800} Hz</span>
                  </div>
                  <div className="p-3 bg-zinc-950 rounded-2xl border border-zinc-800/70">
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 block mb-1">Степ ритма</span>
                    <span className="text-sm font-bold text-emerald-400">{isPlaying ? `#${currentStep + 1}` : 'Готов'}</span>
                  </div>
                </div>

                {/* Chords Sequence */}
                {currentTrack.chordProgression && currentTrack.chordProgression.length > 0 && (
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold block mb-2">
                      Гармоническая сетка (аккорды)
                    </span>
                    <div className="flex gap-2">
                      {currentTrack.chordProgression.map((chord, idx) => (
                        <div
                          key={idx}
                          className="flex-1 py-2 px-3 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-xs font-mono font-bold text-zinc-200"
                        >
                          {chord}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lyrics / Spoken Text */}
                {currentTrack.lyrics && (
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-800/80">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                        <Mic className="w-3.5 h-3.5 text-pink-400" />
                        <span>Текст и вокальные партии:</span>
                      </div>
                      <button
                        onClick={handleCopyLyrics}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                      >
                        {copiedLyrics ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Копировать слова</span>
                      </button>
                    </div>
                    <pre className="text-xs text-zinc-300 font-sans whitespace-pre-line italic leading-relaxed">
                      {currentTrack.lyrics}
                    </pre>
                  </div>
                )}

                {/* External Bridge Card */}
                {activePlatform.url && (
                  <div className={`p-4 rounded-2xl bg-zinc-950 border ${activePlatform.borderActive}/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white block">
                          {engine === 'ainanomusic'
                            ? 'Подать трек на конкурс ainanomusic.com'
                            : engine === 'flowmusic'
                            ? 'Открыть трек в Flow Music (flowmusic.app)'
                            : 'Импорт в Treblo.com'}
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {activePlatform.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {engine === 'ainanomusic'
                          ? 'Участвуйте в ежемесячных конкурсах AI Nano Music, получайте голоса сообщества и награды в криптовалюте Nano (XNO).'
                          : engine === 'flowmusic'
                          ? 'Используйте Google DeepMind Lyria 3 Pro для создания версий и генерации AI видео в flowmusic.app.'
                          : 'Откройте платформу Treblo.com для безлимитной доработки песни и вокала.'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {engine === 'ainanomusic' && (
                        <button
                          onClick={handleCopyContestSubmission}
                          className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          {copiedSubmission ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>Копировать заявку</span>
                        </button>
                      )}
                      <a
                        href={activePlatform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-2 bg-gradient-to-r ${activePlatform.gradient} text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-opacity hover:opacity-90 shadow-md`}
                      >
                        <span>На {activePlatform.badge}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-zinc-500 space-y-3">
                <Volume2 className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-medium text-zinc-400">Трек не загружен</p>
                <p className="text-xs text-zinc-600 max-w-sm mx-auto">
                  Выберите платформу (<strong className="text-emerald-400">AI Nano Music</strong>, <strong className="text-cyan-400">Flow Music</strong> или <strong className="text-violet-400">Treblo</strong>), задайте тему и нажмите сгенерировать.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
