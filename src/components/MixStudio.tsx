import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ListMusic,
  Play,
  Square,
  Sparkles,
  Sliders,
  Volume2,
  Wand2,
  Loader2,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  ArrowUpDown,
  MoveUp,
  MoveDown,
  Layers,
  Radio,
  Flame,
  Zap,
  Clock,
  Compass,
  FileText
} from 'lucide-react';
import { audioSynth } from '../utils/audioSynth.js';
import { PRESET_DJ_TRACKS, DjTrack } from '../utils/djAudioEngine.js';

interface MixTrackItem extends DjTrack {
  transitionType?: string;
  mixBars?: number;
}

const TRANSITION_TYPES = [
  { id: 'smooth_crossfade', name: 'Smooth Crossfade', desc: 'Плавное наложение 16 тактов с выравниванием громкостей' },
  { id: 'bass_swap', name: 'Bass Swap & Drop', desc: 'Мгновенная замена низких частот на первой доле дропа' },
  { id: 'filter_sweep', name: 'Filter Sweep HPF/LPF', desc: 'Раскрутка High-Pass фильтра первого трека и открытие второго' },
  { id: 'echo_freeze', name: 'Echo Freeze Out', desc: 'Заморозка эхо-хвоста на вокале и чистый запуск следующего трека' },
  { id: 'drop_cut', name: 'Drop Cut (Instant)', desc: 'Резкий ударный срез на сильную долю без наложения' },
  { id: 'spinback', name: 'Spinback (Vinyl Brake)', desc: 'Эффект обратной перемотки винила с переходом в новый грув' }
];

// Helper to determine Camelot compatibility
function getCamelotCompatibility(c1: string, c2: string): { label: string; score: number; color: string } {
  if (c1 === c2) return { label: 'Идеальная гармония (100%)', score: 100, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
  
  const num1 = parseInt(c1);
  const letter1 = c1.slice(-1);
  const num2 = parseInt(c2);
  const letter2 = c2.slice(-1);

  if (letter1 === letter2) {
    const diff = Math.abs(num1 - num2);
    if (diff === 1 || diff === 11) {
      if ((num2 === num1 + 1) || (num1 === 12 && num2 === 1)) {
        return { label: 'Energy Boost (+1 Key)', score: 90, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
      } else {
        return { label: 'Energy Drop (-1 Key)', score: 85, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' };
      }
    }
  } else if (num1 === num2) {
    return { label: 'Relative Major/Minor', score: 88, color: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30' };
  }

  return { label: 'Контрастный переход', score: 65, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
}

export function MixStudio() {
  const [mixTitle, setMixTitle] = useState('Epic Peak-Time Festival Mixtape');
  const [mixStyle, setMixStyle] = useState('Club & Festival Mainstage');
  const [playlist, setPlaylist] = useState<MixTrackItem[]>([
    { ...PRESET_DJ_TRACKS[0], transitionType: 'Smooth Crossfade', mixBars: 16 },
    { ...PRESET_DJ_TRACKS[1], transitionType: 'Bass Swap & Drop', mixBars: 16 },
    { ...PRESET_DJ_TRACKS[2], transitionType: 'Filter Sweep HPF/LPF', mixBars: 16 },
    { ...PRESET_DJ_TRACKS[5], transitionType: 'Echo Freeze Out', mixBars: 8 }
  ]);

  // AI Mixtape Plan state
  const [isGenerating, setIsGenerating] = useState(false);
  const [mixResult, setMixResult] = useState<any | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Mixtape Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [playbackSeconds, setPlaybackSeconds] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Add Track Modal / Quick selection
  const addTrackToMix = (track: DjTrack) => {
    setPlaylist(prev => [
      ...prev,
      { ...track, id: `mix-${track.id}-${Date.now()}`, transitionType: 'Smooth Crossfade', mixBars: 16 }
    ]);
  };

  const removeTrack = (index: number) => {
    setPlaylist(prev => prev.filter((_, i) => i !== index));
    if (activeTrackIndex >= playlist.length - 1 && activeTrackIndex > 0) {
      setActiveTrackIndex(prev => prev - 1);
    }
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= playlist.length) return;
    setPlaylist(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  const updateTransitionType = (index: number, type: string) => {
    setPlaylist(prev => prev.map((item, i) => i === index ? { ...item, transitionType: type } : item));
  };

  // Playback control
  const togglePlayMixtape = () => {
    if (isPlaying) {
      audioSynth.stop();
      setIsPlaying(false);
    } else {
      if (playlist.length === 0) return;
      const currentTrack = playlist[activeTrackIndex];
      audioSynth.play({
        title: currentTrack.title,
        genre: currentTrack.genre,
        bpm: currentTrack.bpm,
        leadNotes: currentTrack.leadNotes,
        bassline: currentTrack.bassline
      });
      setIsPlaying(true);
    }
  };

  // Auto transition advance
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setPlaybackSeconds(prev => {
          const nextSec = prev + 1;
          // Every 16 seconds advance to next track to showcase smooth continuous mix
          if (nextSec % 16 === 0) {
            setActiveTrackIndex(currentIdx => {
              const nextIdx = (currentIdx + 1) % playlist.length;
              const nextTrack = playlist[nextIdx];
              if (nextTrack) {
                audioSynth.play({
                  title: nextTrack.title,
                  genre: nextTrack.genre,
                  bpm: nextTrack.bpm,
                  leadNotes: nextTrack.leadNotes,
                  bassline: nextTrack.bassline
                });
              }
              return nextIdx;
            });
          }
          return nextSec;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playlist]);

  useEffect(() => {
    return () => {
      audioSynth.stop();
    };
  }, []);

  // Waveform Visualizer
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
          gradient.addColorStop(0, '#06b6d4');
          gradient.addColorStop(0.5, '#3b82f6');
          gradient.addColorStop(1, '#a855f7');

          ctx.fillStyle = gradient;
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }
      } else {
        ctx.fillStyle = '#27272a';
        const bars = 48;
        const bWidth = width / bars;
        for (let i = 0; i < bars; i++) {
          const h = 8 + Math.sin(i * 0.5) * 6;
          ctx.fillRect(i * bWidth, (height - h) / 2, bWidth - 2, h);
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isPlaying]);

  // AI Mix Generation
  const handleGenerateAiMix = async () => {
    setIsGenerating(true);
    try {
      const payload = {
        mixTitle,
        mixStyle,
        tracks: playlist.map(t => ({
          title: t.title,
          artist: t.artist,
          bpm: t.bpm,
          key: t.key,
          camelot: t.camelot,
          energy: t.energy
        })),
        transitionPreference: 'Harmonic Camelot Smooth'
      };

      const res = await fetch('/api/gen/track-mix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Server responded with ${res.status}`);
      const data = await res.json();
      setMixResult(data);
    } catch (err) {
      console.error('Failed to generate mix:', err);
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

  // Generate CUE sheet
  const generateCueSheet = () => {
    let sheet = `TITLE "${mixTitle}"\nPERFORMER "Genesis DJ"\n`;
    let currentMin = 0;
    let currentSec = 0;

    playlist.forEach((track, idx) => {
      const trackNum = String(idx + 1).padStart(2, '0');
      const timeStr = `${String(currentMin).padStart(2, '0')}:${String(currentSec).padStart(2, '0')}:00`;
      sheet += `  TRACK ${trackNum} AUDIO\n`;
      sheet += `    TITLE "${track.title}"\n`;
      sheet += `    PERFORMER "${track.artist}"\n`;
      sheet += `    INDEX 01 ${timeStr}\n`;
      currentMin += 3;
      currentSec += 15;
    });

    copyToClipboard(sheet, 'cue-sheet');
  };

  // Format seconds to mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-cyan-950 via-zinc-900 to-blue-950 border border-cyan-800/40 p-6 sm:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1.5">
                <ListMusic className="w-3.5 h-3.5" /> AI Track Mashup & Mix Studio
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                Колесо Камелота & Нон-стоп Миксы
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Студия Создания Миксов Треков
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Создавайте непрерывные клубные DJ-микстейпы и мэшапы из нескольких песен. Умный расчет гармонического сведения по Колесу Камелота, бесшовные переходы (Bass Swap, Filter Sweep, Echo Freeze) и автоматическое сведение.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerateAiMix}
              disabled={isGenerating}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-cyan-600/25 hover:opacity-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Построение идеального микса...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Сгенерировать AI Микстейп</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mixtape Player Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayMixtape}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg ${
                isPlaying
                  ? 'bg-rose-600 text-white shadow-rose-600/30'
                  : 'bg-cyan-500 text-zinc-950 font-bold shadow-cyan-500/30 hover:bg-cyan-400'
              }`}
            >
              {isPlaying ? <Square className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {isPlaying ? 'LIVE MIXING' : 'PLAYER READY'}
                </span>
                <span className="text-xs text-zinc-500 font-mono">• {formatTime(playbackSeconds)}</span>
              </div>
              <h3 className="text-sm font-bold text-white">
                {playlist[activeTrackIndex]?.title || 'Нет трека'}
              </h3>
              <p className="text-xs text-zinc-400">
                {playlist[activeTrackIndex]?.artist} ({playlist[activeTrackIndex]?.bpm} BPM • {playlist[activeTrackIndex]?.camelot})
              </p>
            </div>
          </div>

          {/* Quick Track Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
            {playlist.map((track, idx) => (
              <button
                key={track.id}
                onClick={() => {
                  setActiveTrackIndex(idx);
                  if (isPlaying) {
                    audioSynth.play({
                      title: track.title,
                      genre: track.genre,
                      bpm: track.bpm,
                      leadNotes: track.leadNotes,
                      bassline: track.bassline
                    });
                  }
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap border ${
                  activeTrackIndex === idx
                    ? 'bg-cyan-500 text-zinc-950 font-bold border-cyan-400'
                    : 'bg-zinc-950/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Track {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time spectrum canvas */}
        <div className="relative w-full h-16 bg-zinc-950 rounded-2xl border border-zinc-800/80 overflow-hidden flex items-center justify-center">
          <canvas ref={canvasRef} width={800} height={64} className="w-full h-full" />
          <div className="absolute bottom-2 right-3 text-[10px] font-mono text-zinc-500">
            Harmonic Continuous Crossfader Active
          </div>
        </div>
      </div>

      {/* Main Tracklist & Harmonic Sequence Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tracklist Sequence (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <ListMusic className="w-4 h-4 text-cyan-400" /> Треклист микса и последовательность
                </h2>
                <p className="text-xs text-zinc-400">Порядок воспроизведения, точки сшивки и тип сведения</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={generateCueSheet}
                  className="px-3 py-1 rounded-xl bg-zinc-800 border border-zinc-700 text-[11px] font-medium text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{copiedKey === 'cue-sheet' ? 'CUE скопирован!' : 'Экспорт CUE-листа'}</span>
                </button>
              </div>
            </div>

            {/* Playlist Items */}
            <div className="space-y-3">
              {playlist.map((track, idx) => {
                const nextTrack = playlist[idx + 1];
                const compatibility = nextTrack ? getCamelotCompatibility(track.camelot, nextTrack.camelot) : null;

                return (
                  <div key={track.id} className="space-y-2">
                    {/* Track Card */}
                    <div
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        activeTrackIndex === idx
                          ? 'bg-cyan-950/30 border-cyan-500 shadow-md'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-xl bg-zinc-800 flex items-center justify-center font-mono font-bold text-xs text-zinc-300">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-white">{track.title}</h4>
                          <p className="text-[11px] text-zinc-400">
                            {track.artist} • <span className="text-zinc-300">{track.genre}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Camelot & BPM Badges */}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                          {track.camelot} ({track.key})
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 border border-zinc-700 text-zinc-300">
                          {track.bpm} BPM
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-pink-500/10 border border-pink-500/30 text-pink-300">
                          Energy: {track.energy}/10
                        </span>

                        {/* Move Up/Down Controls */}
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => moveTrack(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveTrack(idx, 'down')}
                            disabled={idx === playlist.length - 1}
                            className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => removeTrack(idx)}
                            className="p-1.5 rounded-lg bg-zinc-800 text-rose-400 hover:bg-rose-950/60 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Transition Bridge to Next Track */}
                    {nextTrack && compatibility && (
                      <div className="p-3 rounded-2xl bg-zinc-950/30 border border-dashed border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ml-4 sm:ml-8">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${compatibility.color}`}>
                            {compatibility.label}
                          </span>
                          <span className="text-zinc-500 font-mono text-[11px]">
                            {track.camelot} ➔ {nextTrack.camelot} (Δ {Math.abs(track.bpm - nextTrack.bpm)} BPM)
                          </span>
                        </div>

                        {/* Transition Style Selector */}
                        <select
                          value={track.transitionType || 'Smooth Crossfade'}
                          onChange={e => updateTransitionType(idx, e.target.value)}
                          className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-700 text-[11px] text-zinc-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                        >
                          {TRANSITION_TYPES.map(t => (
                            <option key={t.id} value={t.name}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Add Track & Camelot Legend (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Quick Track Library Add */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-3.5 h-3.5 text-cyan-400" /> Добавить трек в микс
            </h3>
            <p className="text-xs text-zinc-400">Выберите готовые треки для добавления в последовательность:</p>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {PRESET_DJ_TRACKS.map(pt => (
                <button
                  key={pt.id}
                  onClick={() => addTrackToMix(pt)}
                  className="w-full text-left p-2.5 rounded-xl bg-zinc-950/50 border border-zinc-800/80 hover:border-cyan-500/50 hover:bg-zinc-800/40 transition-all flex items-center justify-between text-xs text-zinc-300 cursor-pointer"
                >
                  <div>
                    <p className="font-bold text-white text-[11px]">{pt.title}</p>
                    <p className="text-[10px] text-zinc-500">{pt.bpm} BPM • {pt.camelot}</p>
                  </div>
                  <span className="p-1 rounded-lg bg-zinc-800 text-cyan-300">
                    <Plus className="w-3 h-3" />
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Camelot Wheel Info Box */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" /> Правила Колеса Камелота
            </h3>
            <div className="space-y-2 text-xs text-zinc-400 leading-relaxed">
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-bold text-emerald-300">• Perfect Harmonic (8A ➔ 8A):</span>
                <p className="text-[11px] mt-0.5">Полное совпадение лада и тональности. Вокал и бас идеально накладываются друг на друга.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-bold text-cyan-300">• Energy Boost (+1 Key, 8A ➔ 9A):</span>
                <p className="text-[11px] mt-0.5">Движение по часовой стрелке поднимает тонус и энергетику микса перед главным дропом.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
                <span className="font-bold text-fuchsia-300">• Relative Shift (8A ➔ 8B):</span>
                <p className="text-[11px] mt-0.5">Переход из минора в мажор или наоборот, создающий эмоциональный подъем.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Mix Master Result */}
      {mixResult && (
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  AI Continuous Mixtape Plan
                </span>
                <span className="text-xs font-mono text-zinc-400">{mixResult.estimatedDuration}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mt-1">
                {mixResult.mixTitle}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {mixResult.mixStyle} • {mixResult.totalTracks} треков
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(JSON.stringify(mixResult, null, 2), 'mix-json')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {copiedKey === 'mix-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'mix-json' ? 'Скопировано!' : 'Экспорт микс-плана'}</span>
            </button>
          </div>

          {/* Harmonic Summary */}
          <div className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-1">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
              Гармоническая драматургия сета
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              {mixResult.harmonicFlowSummary}
            </p>
          </div>

          {/* Energy Progression Curve */}
          {mixResult.energyCurve && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Кривая эмоциональной энергии танцпола
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {mixResult.energyCurve.map((curve: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-zinc-200">{curve.phase}</span>
                      <span className="text-cyan-400 font-mono">{curve.level}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full"
                        style={{ width: `${curve.level}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-zinc-400">{curve.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step-by-Step Transition Guidance */}
          {mixResult.transitions && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Пошаговые инструкции сведения треков
              </h3>
              <div className="space-y-3">
                {mixResult.transitions.map((trans: any, idx: number) => (
                  <div key={idx} className="p-4 rounded-2xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-xs">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold text-white">
                          {trans.fromTrack} ➔ {trans.toTrack}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-cyan-300">
                          {trans.transitionType}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-zinc-800 text-zinc-400">
                          {trans.camelotStep}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-300 bg-zinc-900/60 p-3 rounded-xl border border-zinc-800">
                      {trans.instructions}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pro Tips */}
          {mixResult.proDjTips && (
            <div className="p-4 rounded-2xl bg-zinc-950/40 border border-zinc-800 space-y-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Советы хедлайнеров фестивалей по данному миксу
              </h3>
              <ul className="space-y-1.5 text-xs text-zinc-400">
                {mixResult.proDjTips.map((tip: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{tip}</span>
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
