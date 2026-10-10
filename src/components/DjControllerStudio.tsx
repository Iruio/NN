import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Disc,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Sliders,
  Radio,
  Sparkles,
  Zap,
  Flame,
  Download,
  Upload,
  Layers,
  ChevronDown,
  Gauge,
  Music,
  Headphones,
  CircleDot
} from 'lucide-react';
import { djEngine, PRESET_DJ_TRACKS, DjTrack } from '../utils/djAudioEngine.js';

interface PadMode {
  id: 'hot_cue' | 'loop' | 'sampler';
  label: string;
}

export function DjControllerStudio() {
  // Engine Init state
  const [isInitialized, setIsInitialized] = useState(false);

  // Deck A State
  const [deckATrack, setDeckATrack] = useState<DjTrack>(PRESET_DJ_TRACKS[0]);
  const [deckAPlaying, setDeckAPlaying] = useState(false);
  const [deckABpm, setDeckABpm] = useState(PRESET_DJ_TRACKS[0].bpm);
  const [deckAPitch, setDeckAPitch] = useState(0); // % (-16 to +16)
  const [deckAPos, setDeckAPos] = useState(0);
  const [deckALoop, setDeckALoop] = useState(false);
  const [deckALoopBeats, setDeckALoopBeats] = useState(4);
  const [deckAHotCues, setDeckAHotCues] = useState<(boolean)[]>([true, true, true, true]);
  const [deckAPadMode, setDeckAPadMode] = useState<'hot_cue' | 'loop' | 'sampler'>('hot_cue');

  // Deck A Mixer
  const [deckAGain, setDeckAGain] = useState(1.0);
  const [deckAVolume, setDeckAVolume] = useState(0.85);
  const [deckAEqHigh, setDeckAEqHigh] = useState(0);
  const [deckAEqMid, setDeckAEqMid] = useState(0);
  const [deckAEqLow, setDeckAEqLow] = useState(0);
  const [deckAKillLow, setDeckAKillLow] = useState(false);
  const [deckAKillMid, setDeckAKillMid] = useState(false);
  const [deckAKillHigh, setDeckAKillHigh] = useState(false);
  const [deckAFilter, setDeckAFilter] = useState(0); // -100 to +100
  const [deckAVu, setDeckAVu] = useState(0);

  // Deck B State
  const [deckBTrack, setDeckBTrack] = useState<DjTrack>(PRESET_DJ_TRACKS[1]);
  const [deckBPlaying, setDeckBPlaying] = useState(false);
  const [deckBBpm, setDeckBBpm] = useState(PRESET_DJ_TRACKS[1].bpm);
  const [deckBPitch, setDeckBPitch] = useState(0);
  const [deckBPos, setDeckBPos] = useState(0);
  const [deckBLoop, setDeckBLoop] = useState(false);
  const [deckBLoopBeats, setDeckBLoopBeats] = useState(4);
  const [deckBHotCues, setDeckBHotCues] = useState<(boolean)[]>([true, true, true, true]);
  const [deckBPadMode, setDeckBPadMode] = useState<'hot_cue' | 'loop' | 'sampler'>('hot_cue');

  // Deck B Mixer
  const [deckBGain, setDeckBGain] = useState(1.0);
  const [deckBVolume, setDeckBVolume] = useState(0.85);
  const [deckBEqHigh, setDeckBEqHigh] = useState(0);
  const [deckBEqMid, setDeckBEqMid] = useState(0);
  const [deckBEqLow, setDeckBEqLow] = useState(0);
  const [deckBKillLow, setDeckBKillLow] = useState(false);
  const [deckBKillMid, setDeckBKillMid] = useState(false);
  const [deckBKillHigh, setDeckBKillHigh] = useState(false);
  const [deckBFilter, setDeckBFilter] = useState(0);
  const [deckBVu, setDeckBVu] = useState(0);

  // Master Section
  const [crossfader, setCrossfader] = useState(0); // -1 to +1
  const [crossfaderCurve, setCrossfaderCurve] = useState<'smooth' | 'cut' | 'linear'>('smooth');
  const [masterVolume, setMasterVolume] = useState(0.9);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // FX Unit
  const [fxDelay, setFxDelay] = useState(0);
  const [fxReverb, setFxReverb] = useState(0);

  // Scratch interaction refs
  const jogRefA = useRef<HTMLDivElement | null>(null);
  const jogRefB = useRef<HTMLDivElement | null>(null);
  const isScratchingA = useRef(false);
  const isScratchingB = useRef(false);
  const lastMouseYA = useRef(0);
  const lastMouseYB = useRef(0);

  // Init Engine
  const ensureInit = () => {
    if (!isInitialized) {
      djEngine.init();
      setIsInitialized(true);
    }
  };

  // Deck A Play / Pause / Cue
  const togglePlayDeckA = () => {
    ensureInit();
    if (deckAPlaying) {
      djEngine.deckA.pause();
      setDeckAPlaying(false);
    } else {
      djEngine.deckA.play();
      setDeckAPlaying(true);
    }
  };

  const handleCueDeckA = () => {
    ensureInit();
    djEngine.deckA.cue();
    setDeckAPlaying(djEngine.deckA.isPlaying);
    setDeckAPos(djEngine.deckA.positionSeconds);
  };

  const handleSyncDeckA = () => {
    ensureInit();
    djEngine.deckA.syncTo(djEngine.deckB.bpm);
    setDeckAPitch(djEngine.deckA.pitchPercent);
    setDeckABpm(djEngine.deckA.bpm);
  };

  // Deck B Play / Pause / Cue
  const togglePlayDeckB = () => {
    ensureInit();
    if (deckBPlaying) {
      djEngine.deckB.pause();
      setDeckBPlaying(false);
    } else {
      djEngine.deckB.play();
      setDeckBPlaying(true);
    }
  };

  const handleCueDeckB = () => {
    ensureInit();
    djEngine.deckB.cue();
    setDeckBPlaying(djEngine.deckB.isPlaying);
    setDeckBPos(djEngine.deckB.positionSeconds);
  };

  const handleSyncDeckB = () => {
    ensureInit();
    djEngine.deckB.syncTo(djEngine.deckA.bpm);
    setDeckBPitch(djEngine.deckB.pitchPercent);
    setDeckBBpm(djEngine.deckB.bpm);
  };

  // Pitch Faders
  const handlePitchChangeA = (val: number) => {
    ensureInit();
    setDeckAPitch(val);
    djEngine.deckA.setPitch(val);
    setDeckABpm(djEngine.deckA.bpm);
  };

  const handlePitchChangeB = (val: number) => {
    ensureInit();
    setDeckBPitch(val);
    djEngine.deckB.setPitch(val);
    setDeckBBpm(djEngine.deckB.bpm);
  };

  // Mixer Controls
  const handleCrossfader = (val: number) => {
    ensureInit();
    setCrossfader(val);
    djEngine.setCrossfader(val);
  };

  const handleVolA = (val: number) => {
    ensureInit();
    setDeckAVolume(val);
    djEngine.deckA.setVolume(val);
  };

  const handleVolB = (val: number) => {
    ensureInit();
    setDeckBVolume(val);
    djEngine.deckB.setVolume(val);
  };

  const handleGainA = (val: number) => {
    ensureInit();
    setDeckAGain(val);
    djEngine.deckA.setTrim(val);
  };

  const handleGainB = (val: number) => {
    ensureInit();
    setDeckBGain(val);
    djEngine.deckB.setTrim(val);
  };

  // EQ Deck A
  const handleEqA = (band: 'high' | 'mid' | 'low', val: number) => {
    ensureInit();
    if (band === 'high') { setDeckAEqHigh(val); djEngine.deckA.setEq('high', val); }
    if (band === 'mid') { setDeckAEqMid(val); djEngine.deckA.setEq('mid', val); }
    if (band === 'low') { setDeckAEqLow(val); djEngine.deckA.setEq('low', val); }
  };

  const toggleKillA = (band: 'high' | 'mid' | 'low') => {
    ensureInit();
    djEngine.deckA.toggleKill(band);
    if (band === 'low') setDeckAKillLow(djEngine.deckA.killLow);
    if (band === 'mid') setDeckAKillMid(djEngine.deckA.killMid);
    if (band === 'high') setDeckAKillHigh(djEngine.deckA.killHigh);
  };

  // EQ Deck B
  const handleEqB = (band: 'high' | 'mid' | 'low', val: number) => {
    ensureInit();
    if (band === 'high') { setDeckBEqHigh(val); djEngine.deckB.setEq('high', val); }
    if (band === 'mid') { setDeckBEqMid(val); djEngine.deckB.setEq('mid', val); }
    if (band === 'low') { setDeckBEqLow(val); djEngine.deckB.setEq('low', val); }
  };

  const toggleKillB = (band: 'high' | 'mid' | 'low') => {
    ensureInit();
    djEngine.deckB.toggleKill(band);
    if (band === 'low') setDeckBKillLow(djEngine.deckB.killLow);
    if (band === 'mid') setDeckBKillMid(djEngine.deckB.killMid);
    if (band === 'high') setDeckBKillHigh(djEngine.deckB.killHigh);
  };

  // Sound Color Filters
  const handleFilterA = (val: number) => {
    ensureInit();
    setDeckAFilter(val);
    djEngine.deckA.setSoundFilter(val);
  };

  const handleFilterB = (val: number) => {
    ensureInit();
    setDeckBFilter(val);
    djEngine.deckB.setSoundFilter(val);
  };

  // FX controls
  const handleFxDelay = (val: number) => {
    ensureInit();
    setFxDelay(val);
    djEngine.deckA.setFx(val, fxReverb);
    djEngine.deckB.setFx(val, fxReverb);
  };

  const handleFxReverb = (val: number) => {
    ensureInit();
    setFxReverb(val);
    djEngine.deckA.setFx(fxDelay, val);
    djEngine.deckB.setFx(fxDelay, val);
  };

  // Scratch Handlers Deck A
  const handleJogMouseDownA = (e: React.MouseEvent) => {
    ensureInit();
    isScratchingA.current = true;
    lastMouseYA.current = e.clientY;
  };

  const handleJogMouseMoveA = (e: React.MouseEvent) => {
    if (!isScratchingA.current) return;
    const deltaY = lastMouseYA.current - e.clientY;
    lastMouseYA.current = e.clientY;
    if (Math.abs(deltaY) > 2) {
      const forward = deltaY > 0;
      const intensity = Math.min(1, Math.abs(deltaY) / 20);
      djEngine.deckA.triggerScratch(intensity, forward);
    }
  };

  const handleJogMouseUpA = () => {
    isScratchingA.current = false;
  };

  // Scratch Handlers Deck B
  const handleJogMouseDownB = (e: React.MouseEvent) => {
    ensureInit();
    isScratchingB.current = true;
    lastMouseYB.current = e.clientY;
  };

  const handleJogMouseMoveB = (e: React.MouseEvent) => {
    if (!isScratchingB.current) return;
    const deltaY = lastMouseYB.current - e.clientY;
    lastMouseYB.current = e.clientY;
    if (Math.abs(deltaY) > 2) {
      const forward = deltaY > 0;
      const intensity = Math.min(1, Math.abs(deltaY) / 20);
      djEngine.deckB.triggerScratch(intensity, forward);
    }
  };

  const handleJogMouseUpB = () => {
    isScratchingB.current = false;
  };

  // Performance Pads Handlers
  const handlePadClickA = (index: number) => {
    ensureInit();
    if (deckAPadMode === 'hot_cue') {
      djEngine.deckA.jumpToHotCue(index);
      setDeckAPlaying(true);
    } else if (deckAPadMode === 'loop') {
      const beats = [0.25, 0.5, 1, 2, 4, 8, 16, 32][index] || 4;
      const willActive = !(deckALoop && deckALoopBeats === beats);
      setDeckALoop(willActive);
      setDeckALoopBeats(beats);
      djEngine.deckA.setLoop(willActive, beats);
    } else if (deckAPadMode === 'sampler') {
      const samples: ('airhorn' | 'drop' | 'laser' | 'siren' | 'scratch' | 'boom')[] = [
        'airhorn', 'drop', 'laser', 'siren', 'scratch', 'boom', 'airhorn', 'laser'
      ];
      djEngine.triggerSample(samples[index]);
    }
  };

  const handlePadClickB = (index: number) => {
    ensureInit();
    if (deckBPadMode === 'hot_cue') {
      djEngine.deckB.jumpToHotCue(index);
      setDeckBPlaying(true);
    } else if (deckBPadMode === 'loop') {
      const beats = [0.25, 0.5, 1, 2, 4, 8, 16, 32][index] || 4;
      const willActive = !(deckBLoop && deckBLoopBeats === beats);
      setDeckBLoop(willActive);
      setDeckBLoopBeats(beats);
      djEngine.deckB.setLoop(willActive, beats);
    } else if (deckBPadMode === 'sampler') {
      const samples: ('airhorn' | 'drop' | 'laser' | 'siren' | 'scratch' | 'boom')[] = [
        'airhorn', 'drop', 'laser', 'siren', 'scratch', 'boom', 'airhorn', 'laser'
      ];
      djEngine.triggerSample(samples[index]);
    }
  };

  // Live Mix Recording
  const toggleRecording = () => {
    ensureInit();
    if (!isRecording) {
      const started = djEngine.startRecording();
      if (started) {
        setIsRecording(true);
        setRecordDuration(0);
      }
    } else {
      djEngine.stopRecording();
      setIsRecording(false);
      // Timeout to grab url
      setTimeout(() => {
        setRecordedAudioUrl(djEngine.recordedBlobUrl);
      }, 300);
    }
  };

  // Recording Timer & VU Meter Polling
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (isRecording) {
        setRecordDuration(p => p + 1);
      }
      if (isInitialized) {
        if (djEngine.deckA) {
          setDeckAVu(djEngine.deckA.getVuLevel());
          setDeckAPos(djEngine.deckA.positionSeconds);
        }
        if (djEngine.deckB) {
          setDeckBVu(djEngine.deckB.getVuLevel());
          setDeckBPos(djEngine.deckB.positionSeconds);
        }
      }
    }, 100);
    return () => clearInterval(timer);
  }, [isRecording, isInitialized]);

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Load custom tracks
  const loadTrackToDeck = (deck: 'A' | 'B', track: DjTrack) => {
    ensureInit();
    if (deck === 'A') {
      setDeckATrack(track);
      djEngine.deckA.loadTrack(track);
      setDeckABpm(track.bpm);
      setDeckAPitch(0);
    } else {
      setDeckBTrack(track);
      djEngine.deckB.loadTrack(track);
      setDeckBBpm(track.bpm);
      setDeckBPitch(0);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto select-none font-sans">
      {/* Top Header / Bar */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 p-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-violet-600 to-pink-500 p-[1.5px] shadow-lg shadow-violet-500/20">
              <div className="w-full h-full bg-zinc-950 rounded-[14px] flex items-center justify-center">
                <Disc className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-wider">
                  GENESIS <span className="text-cyan-400">DDJ-PRO</span> CONTROLLER
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-950/60 border border-cyan-800/60 text-cyan-300">
                  Dual-Deck Mixer & Scratch
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Профессиональный двухдековый контроллер со скретчем, 3-полосным эквалайзером, фильтрами, синхронизацией битов и записью сета
              </p>
            </div>
          </div>

          {/* Master Output & Live REC */}
          <div className="flex items-center gap-3">
            {/* Record Button */}
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer shadow-lg ${
                isRecording
                  ? 'bg-rose-600 text-white shadow-rose-600/40 animate-pulse'
                  : 'bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-white hover:border-rose-500/50'
              }`}
            >
              <CircleDot className={`w-3.5 h-3.5 ${isRecording ? 'text-white' : 'text-rose-500'}`} />
              <span>{isRecording ? `REC ${formatSeconds(recordDuration)}` : 'REC LIVE SET'}</span>
            </button>

            {/* Recorded File Download */}
            {recordedAudioUrl && (
              <a
                href={recordedAudioUrl}
                download="genesis-dj-live-mix.webm"
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Скачать микс</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Main Hardware Console Body */}
      <div className="bg-zinc-950 border-2 border-zinc-800 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

        {/* 3 Main Hardware Columns: Deck A (Left) | Mixer (Center) | Deck B (Right) */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* ===================== DECK A (4 cols) ===================== */}
          <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-xl">
            {/* Deck A Header Info */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-cyan-500 text-zinc-950 font-mono">
                    DECK A
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[160px]">
                    {deckATrack.title}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {deckATrack.artist} • {deckATrack.camelot} ({deckATrack.key})
                </p>
              </div>

              {/* Track Selector Dropdown */}
              <select
                value={deckATrack.id}
                onChange={e => {
                  const t = PRESET_DJ_TRACKS.find(pt => pt.id === e.target.value);
                  if (t) loadTrackToDeck('A', t);
                }}
                className="px-2 py-1 rounded-xl bg-zinc-950 border border-zinc-700 text-[10px] text-zinc-300 focus:outline-none focus:border-cyan-500 cursor-pointer"
              >
                {PRESET_DJ_TRACKS.map(pt => (
                  <option key={pt.id} value={pt.id}>
                    {pt.title} ({pt.bpm} BPM)
                  </option>
                ))}
              </select>
            </div>

            {/* Time & BPM Display Bar */}
            <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs font-mono">
              <div>
                <span className="text-zinc-500 text-[10px]">TIME ELAPSED:</span>
                <p className="font-bold text-cyan-400 text-sm">{formatSeconds(deckAPos)}</p>
              </div>
              <div className="text-center">
                <span className="text-zinc-500 text-[10px]">TEMPO:</span>
                <p className="font-bold text-white text-sm">
                  {deckABpm.toFixed(1)} <span className="text-[10px] text-zinc-400">BPM</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 text-[10px]">PITCH:</span>
                <p className="font-bold text-cyan-400 text-sm">
                  {deckAPitch > 0 ? `+${deckAPitch.toFixed(1)}%` : `${deckAPitch.toFixed(1)}%`}
                </p>
              </div>
            </div>

            {/* Jog Wheel & Pitch Fader Section */}
            <div className="flex items-center justify-between gap-4 py-2">
              {/* Spinning Interactive Vinyl Jog Wheel */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div
                  ref={jogRefA}
                  onMouseDown={handleJogMouseDownA}
                  onMouseMove={handleJogMouseMoveA}
                  onMouseUp={handleJogMouseUpA}
                  onMouseLeave={handleJogMouseUpA}
                  className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950 border-4 border-zinc-800 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none group"
                >
                  {/* Vinyl Grooves concentric rings */}
                  <div className="absolute inset-2 rounded-full border border-zinc-800/80" />
                  <div className="absolute inset-5 rounded-full border border-zinc-800/60" />
                  <div className="absolute inset-8 rounded-full border border-zinc-800/40" />

                  {/* Rotating needle / playhead indicator */}
                  <div
                    className={`absolute inset-0 rounded-full flex items-start justify-center ${
                      deckAPlaying ? 'animate-spin' : ''
                    }`}
                    style={{ animationDuration: `${(60 / deckABpm) * 4}s` }}
                  >
                    <div className="w-1.5 h-6 bg-cyan-400 rounded-full shadow-lg shadow-cyan-400/50 mt-1" />
                  </div>

                  {/* Center Hub */}
                  <div className="relative w-18 h-18 rounded-full bg-zinc-950 border-2 border-cyan-500/60 flex flex-col items-center justify-center shadow-inner">
                    <Disc className={`w-6 h-6 ${deckAPlaying ? 'text-cyan-400 animate-spin' : 'text-zinc-600'}`} />
                    <span className="text-[9px] font-mono text-cyan-300 font-bold mt-0.5">SCRATCH</span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 mt-2 font-mono">
                  {deckAPlaying ? '● ROTATING • DRAG TO SCRATCH' : 'DRAG TO SCRATCH'}
                </span>
              </div>

              {/* Vertical Pitch Fader (Tempo Slider) */}
              <div className="w-16 flex flex-col items-center bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 space-y-2">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">PITCH</span>
                <span className="text-[9px] font-mono text-cyan-400">+16%</span>
                <input
                  type="range"
                  min="-16"
                  max="16"
                  step="0.1"
                  value={deckAPitch}
                  onChange={e => handlePitchChangeA(Number(e.target.value))}
                  className="h-32 -rotate-90 w-32 accent-cyan-500 cursor-pointer my-4"
                />
                <span className="text-[9px] font-mono text-cyan-400">-16%</span>
                <button
                  onClick={() => handlePitchChangeA(0)}
                  className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  RESET
                </button>
              </div>
            </div>

            {/* Deck A Transport Buttons: PLAY / PAUSE, CUE, SYNC */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCueDeckA}
                className="py-3 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-300 font-black text-xs hover:bg-amber-900/60 transition-all cursor-pointer shadow-lg shadow-amber-900/10 active:scale-95"
              >
                CUE
              </button>

              <button
                onClick={togglePlayDeckA}
                className={`py-3 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-1.5 ${
                  deckAPlaying
                    ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/40 font-black'
                    : 'bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                {deckAPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{deckAPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              <button
                onClick={handleSyncDeckA}
                className="py-3 rounded-2xl bg-cyan-950/40 border border-cyan-600/40 text-cyan-300 font-black text-xs hover:bg-cyan-900/60 transition-all cursor-pointer shadow-lg shadow-cyan-900/10 active:scale-95"
              >
                SYNC
              </button>
            </div>

            {/* Performance Pads Section */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase">PERFORMANCE PADS</span>
                <div className="flex items-center gap-1">
                  {(['hot_cue', 'loop', 'sampler'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setDeckAPadMode(mode)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-colors ${
                        deckAPadMode === mode
                          ? 'bg-cyan-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mode === 'hot_cue' ? 'CUE' : mode === 'loop' ? 'LOOP' : 'SAMPLE'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 8 RGB Pads */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(idx => {
                  const label =
                    deckAPadMode === 'hot_cue'
                      ? `CUE ${idx + 1}`
                      : deckAPadMode === 'loop'
                      ? `${[0.25, 0.5, 1, 2, 4, 8, 16, 32][idx]}B`
                      : ['AIR', 'DROP', 'LASER', 'SIREN', 'SCRATCH', 'BOOM', 'HORN', 'ZAP'][idx];

                  return (
                    <button
                      key={idx}
                      onClick={() => handlePadClickA(idx)}
                      className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-cyan-300 hover:bg-cyan-500 hover:text-zinc-950 hover:border-cyan-400 transition-all cursor-pointer active:scale-95 shadow-md"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Vinyl Action Buttons: Brake & Spinback */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  ensureInit();
                  djEngine.deckA.triggerSpinback();
                }}
                className="flex-1 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer"
              >
                SPINBACK
              </button>
              <button
                onClick={() => {
                  ensureInit();
                  djEngine.deckA.triggerTurntableBrake();
                  setDeckAPlaying(false);
                }}
                className="flex-1 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer"
              >
                BRAKE STOP
              </button>
            </div>
          </div>

          {/* ===================== CENTRAL MIXER (2 cols) ===================== */}
          <div className="lg:col-span-2 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-xl">
            {/* Mixer Header */}
            <div className="text-center border-b border-zinc-800 pb-2">
              <span className="text-[10px] font-mono font-black tracking-widest text-zinc-400 uppercase">
                DJ MIXER
              </span>
            </div>

            {/* Master Volume & FX Knobs */}
            <div className="space-y-3 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                <span>MASTER:</span>
                <span className="text-white font-bold">{Math.round(masterVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={e => {
                  const v = Number(e.target.value);
                  setMasterVolume(v);
                  djEngine.setMasterVolume(v);
                }}
                className="w-full accent-white cursor-pointer"
              />

              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-1">
                <span>DELAY FX:</span>
                <span className="text-cyan-400 font-bold">{Math.round(fxDelay * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.02"
                value={fxDelay}
                onChange={e => handleFxDelay(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />

              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 pt-1">
                <span>REVERB:</span>
                <span className="text-fuchsia-400 font-bold">{Math.round(fxReverb * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.8"
                step="0.02"
                value={fxReverb}
                onChange={e => handleFxReverb(Number(e.target.value))}
                className="w-full accent-fuchsia-500 cursor-pointer"
              />
            </div>

            {/* Dual Channel EQ & Filters */}
            <div className="grid grid-cols-2 gap-2 text-center text-[10px] font-mono">
              {/* Channel A EQ */}
              <div className="space-y-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                <span className="font-bold text-cyan-400">CH A</span>
                {/* Trim */}
                <div>
                  <span className="text-zinc-500 text-[9px]">TRIM</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={deckAGain}
                    onChange={e => handleGainA(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                {/* HI */}
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-400">
                    <span>HI</span>
                    <button
                      onClick={() => toggleKillA('high')}
                      className={`text-[8px] font-bold px-1 rounded cursor-pointer ${
                        deckAKillHigh ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      KILL
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="6"
                    value={deckAEqHigh}
                    onChange={e => handleEqA('high', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                {/* MID */}
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-400">
                    <span>MID</span>
                    <button
                      onClick={() => toggleKillA('mid')}
                      className={`text-[8px] font-bold px-1 rounded cursor-pointer ${
                        deckAKillMid ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      KILL
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="6"
                    value={deckAEqMid}
                    onChange={e => handleEqA('mid', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                {/* LOW */}
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-400">
                    <span>LOW</span>
                    <button
                      onClick={() => toggleKillA('low')}
                      className={`text-[8px] font-bold px-1 rounded cursor-pointer ${
                        deckAKillLow ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      KILL
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="6"
                    value={deckAEqLow}
                    onChange={e => handleEqA('low', Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>
                {/* Sound Color Filter */}
                <div className="pt-1">
                  <span className="text-[9px] text-zinc-400 font-bold">FILTER</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={deckAFilter}
                    onChange={e => handleFilterA(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <span className="text-[8px] text-zinc-500">
                    {deckAFilter < 0 ? 'LPF' : deckAFilter > 0 ? 'HPF' : 'OFF'}
                  </span>
                </div>
              </div>

              {/* Channel B EQ */}
              <div className="space-y-2 bg-zinc-950 p-2 rounded-xl border border-zinc-800/80">
                <span className="font-bold text-pink-400">CH B</span>
                {/* Trim */}
                <div>
                  <span className="text-zinc-500 text-[9px]">TRIM</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={deckBGain}
                    onChange={e => handleGainB(Number(e.target.value))}
                    className="w-full accent-pink-400 cursor-pointer"
                  />
                </div>
                {/* HI */}
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-400">
                    <span>HI</span>
                    <button
                      onClick={() => toggleKillB('high')}
                      className={`text-[8px] font-bold px-1 rounded cursor-pointer ${
                        deckBKillHigh ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      KILL
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="6"
                    value={deckBEqHigh}
                    onChange={e => handleEqB('high', Number(e.target.value))}
                    className="w-full accent-pink-400 cursor-pointer"
                  />
                </div>
                {/* MID */}
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-400">
                    <span>MID</span>
                    <button
                      onClick={() => toggleKillB('mid')}
                      className={`text-[8px] font-bold px-1 rounded cursor-pointer ${
                        deckBKillMid ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      KILL
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="6"
                    value={deckBEqMid}
                    onChange={e => handleEqB('mid', Number(e.target.value))}
                    className="w-full accent-pink-400 cursor-pointer"
                  />
                </div>
                {/* LOW */}
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-400">
                    <span>LOW</span>
                    <button
                      onClick={() => toggleKillB('low')}
                      className={`text-[8px] font-bold px-1 rounded cursor-pointer ${
                        deckBKillLow ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      KILL
                    </button>
                  </div>
                  <input
                    type="range"
                    min="-40"
                    max="6"
                    value={deckBEqLow}
                    onChange={e => handleEqB('low', Number(e.target.value))}
                    className="w-full accent-pink-400 cursor-pointer"
                  />
                </div>
                {/* Sound Color Filter */}
                <div className="pt-1">
                  <span className="text-[9px] text-zinc-400 font-bold">FILTER</span>
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={deckBFilter}
                    onChange={e => handleFilterB(Number(e.target.value))}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                  <span className="text-[8px] text-zinc-500">
                    {deckBFilter < 0 ? 'LPF' : deckBFilter > 0 ? 'HPF' : 'OFF'}
                  </span>
                </div>
              </div>
            </div>

            {/* Vertical Channel Faders & LED VU Meters */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              {/* Channel A Fader & VU */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[9px] font-mono text-cyan-400">VOL A</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={deckAVolume}
                  onChange={e => handleVolA(Number(e.target.value))}
                  className="h-24 -rotate-90 w-24 accent-cyan-500 cursor-pointer my-2"
                />
                {/* 5-segment LED VU */}
                <div className="flex gap-0.5 mt-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((thr, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-3 rounded-sm ${
                        deckAVu >= thr
                          ? i === 4 ? 'bg-rose-500 shadow-sm shadow-rose-500' : i >= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Channel B Fader & VU */}
              <div className="flex flex-col items-center space-y-1">
                <span className="text-[9px] font-mono text-pink-400">VOL B</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={deckBVolume}
                  onChange={e => handleVolB(Number(e.target.value))}
                  className="h-24 -rotate-90 w-24 accent-pink-500 cursor-pointer my-2"
                />
                {/* 5-segment LED VU */}
                <div className="flex gap-0.5 mt-1">
                  {[0.2, 0.4, 0.6, 0.8, 1.0].map((thr, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-3 rounded-sm ${
                        deckBVu >= thr
                          ? i === 4 ? 'bg-rose-500 shadow-sm shadow-rose-500' : i >= 3 ? 'bg-amber-400' : 'bg-emerald-400'
                          : 'bg-zinc-800'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Smooth Crossfader */}
            <div className="space-y-1.5 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
              <div className="flex justify-between text-[9px] font-mono text-zinc-400">
                <span className="text-cyan-400 font-bold">A</span>
                <span className="text-zinc-500">CROSSFADER</span>
                <span className="text-pink-400 font-bold">B</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.02"
                value={crossfader}
                onChange={e => handleCrossfader(Number(e.target.value))}
                className="w-full accent-white cursor-pointer"
              />
              <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                <button
                  onClick={() => handleCrossfader(-1)}
                  className="hover:text-cyan-400 cursor-pointer"
                >
                  DECK A
                </button>
                <button
                  onClick={() => handleCrossfader(0)}
                  className="hover:text-white cursor-pointer font-bold"
                >
                  CENTER (0)
                </button>
                <button
                  onClick={() => handleCrossfader(1)}
                  className="hover:text-pink-400 cursor-pointer"
                >
                  DECK B
                </button>
              </div>
            </div>
          </div>

          {/* ===================== DECK B (4 cols) ===================== */}
          <div className="lg:col-span-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 space-y-4 shadow-xl">
            {/* Deck B Header Info */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-pink-500 text-zinc-950 font-mono">
                    DECK B
                  </span>
                  <span className="text-xs font-bold text-white truncate max-w-[160px]">
                    {deckBTrack.title}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {deckBTrack.artist} • {deckBTrack.camelot} ({deckBTrack.key})
                </p>
              </div>

              {/* Track Selector Dropdown */}
              <select
                value={deckBTrack.id}
                onChange={e => {
                  const t = PRESET_DJ_TRACKS.find(pt => pt.id === e.target.value);
                  if (t) loadTrackToDeck('B', t);
                }}
                className="px-2 py-1 rounded-xl bg-zinc-950 border border-zinc-700 text-[10px] text-zinc-300 focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {PRESET_DJ_TRACKS.map(pt => (
                  <option key={pt.id} value={pt.id}>
                    {pt.title} ({pt.bpm} BPM)
                  </option>
                ))}
              </select>
            </div>

            {/* Time & BPM Display Bar */}
            <div className="flex items-center justify-between bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-xs font-mono">
              <div>
                <span className="text-zinc-500 text-[10px]">TIME ELAPSED:</span>
                <p className="font-bold text-pink-400 text-sm">{formatSeconds(deckBPos)}</p>
              </div>
              <div className="text-center">
                <span className="text-zinc-500 text-[10px]">TEMPO:</span>
                <p className="font-bold text-white text-sm">
                  {deckBBpm.toFixed(1)} <span className="text-[10px] text-zinc-400">BPM</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 text-[10px]">PITCH:</span>
                <p className="font-bold text-pink-400 text-sm">
                  {deckBPitch > 0 ? `+${deckBPitch.toFixed(1)}%` : `${deckBPitch.toFixed(1)}%`}
                </p>
              </div>
            </div>

            {/* Jog Wheel & Pitch Fader Section */}
            <div className="flex items-center justify-between gap-4 py-2">
              {/* Spinning Interactive Vinyl Jog Wheel */}
              <div className="flex-1 flex flex-col items-center justify-center">
                <div
                  ref={jogRefB}
                  onMouseDown={handleJogMouseDownB}
                  onMouseMove={handleJogMouseMoveB}
                  onMouseUp={handleJogMouseUpB}
                  onMouseLeave={handleJogMouseUpB}
                  className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-gradient-to-tr from-zinc-950 via-zinc-900 to-zinc-950 border-4 border-zinc-800 shadow-2xl flex items-center justify-center cursor-grab active:cursor-grabbing select-none group"
                >
                  <div className="absolute inset-2 rounded-full border border-zinc-800/80" />
                  <div className="absolute inset-5 rounded-full border border-zinc-800/60" />
                  <div className="absolute inset-8 rounded-full border border-zinc-800/40" />

                  {/* Rotating needle / playhead indicator */}
                  <div
                    className={`absolute inset-0 rounded-full flex items-start justify-center ${
                      deckBPlaying ? 'animate-spin' : ''
                    }`}
                    style={{ animationDuration: `${(60 / deckBBpm) * 4}s` }}
                  >
                    <div className="w-1.5 h-6 bg-pink-400 rounded-full shadow-lg shadow-pink-400/50 mt-1" />
                  </div>

                  {/* Center Hub */}
                  <div className="relative w-18 h-18 rounded-full bg-zinc-950 border-2 border-pink-500/60 flex flex-col items-center justify-center shadow-inner">
                    <Disc className={`w-6 h-6 ${deckBPlaying ? 'text-pink-400 animate-spin' : 'text-zinc-600'}`} />
                    <span className="text-[9px] font-mono text-pink-300 font-bold mt-0.5">SCRATCH</span>
                  </div>
                </div>
                <span className="text-[10px] text-zinc-500 mt-2 font-mono">
                  {deckBPlaying ? '● ROTATING • DRAG TO SCRATCH' : 'DRAG TO SCRATCH'}
                </span>
              </div>

              {/* Vertical Pitch Fader (Tempo Slider) */}
              <div className="w-16 flex flex-col items-center bg-zinc-950 p-3 rounded-2xl border border-zinc-800/80 space-y-2">
                <span className="text-[9px] font-mono text-zinc-400 uppercase font-bold">PITCH</span>
                <span className="text-[9px] font-mono text-pink-400">+16%</span>
                <input
                  type="range"
                  min="-16"
                  max="16"
                  step="0.1"
                  value={deckBPitch}
                  onChange={e => handlePitchChangeB(Number(e.target.value))}
                  className="h-32 -rotate-90 w-32 accent-pink-500 cursor-pointer my-4"
                />
                <span className="text-[9px] font-mono text-pink-400">-16%</span>
                <button
                  onClick={() => handlePitchChangeB(0)}
                  className="px-2 py-0.5 rounded text-[9px] font-mono bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                >
                  RESET
                </button>
              </div>
            </div>

            {/* Deck B Transport Buttons: PLAY / PAUSE, CUE, SYNC */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={handleCueDeckB}
                className="py-3 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-300 font-black text-xs hover:bg-amber-900/60 transition-all cursor-pointer shadow-lg shadow-amber-900/10 active:scale-95"
              >
                CUE
              </button>

              <button
                onClick={togglePlayDeckB}
                className={`py-3 rounded-2xl font-black text-xs transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-1.5 ${
                  deckBPlaying
                    ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/40 font-black'
                    : 'bg-emerald-950/40 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/60'
                }`}
              >
                {deckBPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span>{deckBPlaying ? 'PAUSE' : 'PLAY'}</span>
              </button>

              <button
                onClick={handleSyncDeckB}
                className="py-3 rounded-2xl bg-pink-950/40 border border-pink-600/40 text-pink-300 font-black text-xs hover:bg-pink-900/60 transition-all cursor-pointer shadow-lg shadow-pink-900/10 active:scale-95"
              >
                SYNC
              </button>
            </div>

            {/* Performance Pads Section */}
            <div className="bg-zinc-950 p-3 rounded-2xl border border-zinc-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-zinc-400 font-bold uppercase">PERFORMANCE PADS</span>
                <div className="flex items-center gap-1">
                  {(['hot_cue', 'loop', 'sampler'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setDeckBPadMode(mode)}
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-colors ${
                        deckBPadMode === mode
                          ? 'bg-pink-500 text-zinc-950'
                          : 'bg-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {mode === 'hot_cue' ? 'CUE' : mode === 'loop' ? 'LOOP' : 'SAMPLE'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 8 RGB Pads */}
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map(idx => {
                  const label =
                    deckBPadMode === 'hot_cue'
                      ? `CUE ${idx + 1}`
                      : deckBPadMode === 'loop'
                      ? `${[0.25, 0.5, 1, 2, 4, 8, 16, 32][idx]}B`
                      : ['AIR', 'DROP', 'LASER', 'SIREN', 'SCRATCH', 'BOOM', 'HORN', 'ZAP'][idx];

                  return (
                    <button
                      key={idx}
                      onClick={() => handlePadClickB(idx)}
                      className="py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-[10px] font-mono font-bold text-pink-300 hover:bg-pink-500 hover:text-zinc-950 hover:border-pink-400 transition-all cursor-pointer active:scale-95 shadow-md"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Special Vinyl Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  ensureInit();
                  djEngine.deckB.triggerSpinback();
                }}
                className="flex-1 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer"
              >
                SPINBACK
              </button>
              <button
                onClick={() => {
                  ensureInit();
                  djEngine.deckB.triggerTurntableBrake();
                  setDeckBPlaying(false);
                }}
                className="flex-1 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[10px] font-mono text-zinc-400 hover:text-white hover:border-zinc-700 cursor-pointer"
              >
                BRAKE STOP
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
