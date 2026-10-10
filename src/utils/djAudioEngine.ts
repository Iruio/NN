// Web Audio API engine for DJ Controller, Remix Studio, and Track Mixing

export interface DjTrack {
  id: string;
  title: string;
  artist: string;
  genre: string;
  bpm: number;
  key: string; // Camelot or Musical (e.g. "8A" or "Am")
  camelot: string;
  energy: number; // 1-10
  duration: number; // in seconds
  color: string;
  leadNotes?: number[];
  bassline?: number[];
  drumStyle?: 'four_on_floor' | 'breakbeat' | 'trap_808' | 'dnb_stepper' | 'halftime';
  audioUrl?: string; // Optional user uploaded or external audio URL
}

export const PRESET_DJ_TRACKS: DjTrack[] = [
  {
    id: 'track-cyber-1',
    title: 'Neon Cyber Overdrive',
    artist: 'Apex Vibe',
    genre: 'Cyberpunk Synthwave',
    bpm: 124,
    key: 'A minor',
    camelot: '8A',
    energy: 8,
    duration: 180,
    color: '#8b5cf6',
    leadNotes: [69, 72, 74, 76, 79, 76, 74, 72],
    bassline: [45, 45, 48, 48, 41, 41, 43, 43],
    drumStyle: 'four_on_floor'
  },
  {
    id: 'track-house-2',
    title: 'Deep Midnight Groove',
    artist: 'Velvet Club',
    genre: 'Deep & Tech House',
    bpm: 128,
    key: 'E minor',
    camelot: '9A',
    energy: 9,
    duration: 210,
    color: '#06b6d4',
    leadNotes: [64, 67, 71, 74, 71, 67, 69, 64],
    bassline: [40, 40, 40, 47, 45, 45, 43, 43],
    drumStyle: 'four_on_floor'
  },
  {
    id: 'track-slap-3',
    title: 'Tokyo Slap Dimension',
    artist: 'Kuro Beats',
    genre: 'Slap House / EDM',
    bpm: 126,
    key: 'D minor',
    camelot: '7A',
    energy: 9,
    duration: 165,
    color: '#ec4899',
    leadNotes: [62, 65, 69, 72, 70, 69, 65, 62],
    bassline: [38, 38, 38, 45, 41, 41, 43, 43],
    drumStyle: 'four_on_floor'
  },
  {
    id: 'track-dnb-4',
    title: 'Velocity Sub Roller',
    artist: 'Liquid Pulse',
    genre: 'Drum & Bass',
    bpm: 174,
    key: 'B minor',
    camelot: '10A',
    energy: 10,
    duration: 195,
    color: '#f97316',
    leadNotes: [71, 74, 78, 81, 78, 74, 71, 69],
    bassline: [47, 47, 47, 54, 50, 50, 52, 52],
    drumStyle: 'dnb_stepper'
  },
  {
    id: 'track-trap-5',
    title: 'Phantom 808 Mirage',
    artist: 'Ghost Sub',
    genre: 'Trap / Phonk',
    bpm: 140,
    key: 'F minor',
    camelot: '4A',
    energy: 8,
    duration: 150,
    color: '#10b981',
    leadNotes: [65, 68, 72, 75, 72, 68, 67, 65],
    bassline: [41, 41, 41, 41, 37, 37, 39, 39],
    drumStyle: 'trap_808'
  },
  {
    id: 'track-techno-6',
    title: 'Berghain Acid Matrix',
    artist: 'Klangwerk',
    genre: 'Peak Techno',
    bpm: 132,
    key: 'F# minor',
    camelot: '11A',
    energy: 9,
    duration: 220,
    color: '#eab308',
    leadNotes: [66, 69, 73, 78, 73, 69, 66, 64],
    bassline: [42, 42, 42, 42, 42, 45, 43, 42],
    drumStyle: 'four_on_floor'
  }
];

export interface DeckState {
  track: DjTrack | null;
  isPlaying: boolean;
  bpm: number;
  pitch: number; // percentage (-16 to +16)
  masterBpm: number;
  position: number; // current time in seconds
  duration: number;
  loopActive: boolean;
  loopBeats: number; // 0.25, 0.5, 1, 2, 4, 8, 16
  cuePosition: number;
  hotCues: (number | null)[];
  // Audio parameters
  eqLow: number; // -40 to +6 dB (0 is neutral)
  eqMid: number;
  eqHigh: number;
  killLow: boolean;
  killMid: boolean;
  killHigh: boolean;
  filter: number; // -100 (LPF) to +100 (HPF), 0 is flat
  volume: number; // 0 to 1
  gain: number; // 0 to 1.5
  fxDelay: number; // 0 to 1
  fxReverb: number; // 0 to 1
  vuLevel: number; // 0 to 1 for LED meters
}

class DeckAudioChannel {
  private ctx: AudioContext;
  private masterGain: GainNode;
  public track: DjTrack | null = null;
  
  // Audio Nodes
  private channelGain: GainNode;
  private trimGain: GainNode;
  private crossfadeGain: GainNode;
  private lowShelf: BiquadFilterNode;
  private midPeak: BiquadFilterNode;
  private highShelf: BiquadFilterNode;
  private soundFilter: BiquadFilterNode;
  private delayNode: DelayNode;
  private delayFeedback: GainNode;
  private delayWet: GainNode;
  private reverbWet: GainNode;
  private convolver: ConvolverNode;
  public analyser: AnalyserNode;

  // Synthesis playback state
  public isPlaying = false;
  private timerId: number | null = null;
  public currentStep = 0;
  public bpm = 128;
  public baseBpm = 128;
  public pitchPercent = 0;
  public positionSeconds = 0;
  public loopActive = false;
  public loopLengthBeats = 4;
  private loopStartStep = 0;
  public cueStep = 0;
  public hotCueSteps: (number | null)[] = [null, null, null, null];
  private customAudioEl: HTMLAudioElement | null = null;
  private customAudioSource: MediaElementAudioSourceNode | null = null;

  // EQ Kill states
  public killLow = false;
  public killMid = false;
  public killHigh = false;

  constructor(ctx: AudioContext, masterBus: AudioNode) {
    this.ctx = ctx;

    // Gain stages
    this.trimGain = ctx.createGain();
    this.trimGain.gain.value = 1.0;

    // 3-band EQ
    this.lowShelf = ctx.createBiquadFilter();
    this.lowShelf.type = 'lowshelf';
    this.lowShelf.frequency.value = 250;
    this.lowShelf.gain.value = 0;

    this.midPeak = ctx.createBiquadFilter();
    this.midPeak.type = 'peaking';
    this.midPeak.frequency.value = 1200;
    this.midPeak.Q.value = 1.0;
    this.midPeak.gain.value = 0;

    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = 'highshelf';
    this.highShelf.frequency.value = 4000;
    this.highShelf.gain.value = 0;

    // Sound Color Filter (LPF/HPF)
    this.soundFilter = ctx.createBiquadFilter();
    this.soundFilter.type = 'allpass';
    this.soundFilter.frequency.value = 1000;

    // Volume & Crossfade
    this.channelGain = ctx.createGain();
    this.channelGain.gain.value = 0.85;

    this.crossfadeGain = ctx.createGain();
    this.crossfadeGain.gain.value = 1.0;

    // Delay FX
    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.35;
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.value = 0.45;
    this.delayWet = ctx.createGain();
    this.delayWet.gain.value = 0;

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);

    // Reverb FX (synthetic impulse response)
    this.convolver = ctx.createConvolver();
    this.createSyntheticImpulse();
    this.reverbWet = ctx.createGain();
    this.reverbWet.gain.value = 0;
    this.convolver.connect(this.reverbWet);

    // Channel Analyser for VU Meter & Waveform
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;

    // Connect node chain:
    // Source -> Trim -> LowShelf -> MidPeak -> HighShelf -> SoundFilter -> ChannelGain -> CrossfadeGain -> Analyser -> MasterBus
    this.trimGain.connect(this.lowShelf);
    this.lowShelf.connect(this.midPeak);
    this.midPeak.connect(this.highShelf);
    this.highShelf.connect(this.soundFilter);
    this.soundFilter.connect(this.channelGain);

    // FX sends from sound filter
    this.soundFilter.connect(this.delayNode);
    this.soundFilter.connect(this.convolver);
    this.delayWet.connect(this.channelGain);
    this.reverbWet.connect(this.channelGain);

    this.channelGain.connect(this.crossfadeGain);
    this.crossfadeGain.connect(this.analyser);
    this.analyser.connect(masterBus);

    this.masterGain = masterBus as GainNode;
  }

  private createSyntheticImpulse() {
    const rate = this.ctx.sampleRate;
    const length = rate * 1.8;
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (rate * 0.4));
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    this.convolver.buffer = impulse;
  }

  public loadTrack(track: DjTrack) {
    const wasPlaying = this.isPlaying;
    this.stop();
    this.track = track;
    this.baseBpm = track.bpm;
    this.bpm = track.bpm * (1 + this.pitchPercent / 100);
    this.currentStep = 0;
    this.positionSeconds = 0;
    this.cueStep = 0;
    this.hotCueSteps = [0, 16, 32, 48]; // default hot cues: Intro, Verse, Buildup, Drop

    if (track.audioUrl) {
      if (this.customAudioEl) {
        this.customAudioEl.pause();
      }
      this.customAudioEl = new Audio(track.audioUrl);
      this.customAudioEl.crossOrigin = 'anonymous';
      this.customAudioEl.loop = true;
      if (!this.customAudioSource) {
        this.customAudioSource = this.ctx.createMediaElementSource(this.customAudioEl);
        this.customAudioSource.connect(this.trimGain);
      }
    }

    if (wasPlaying) {
      this.play();
    }
  }

  public play() {
    if (this.isPlaying) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;

    if (this.customAudioEl) {
      this.customAudioEl.playbackRate = 1 + this.pitchPercent / 100;
      this.customAudioEl.play().catch(e => console.warn('Custom audio playback notice:', e));
    }

    const startStepTimer = () => {
      const stepDurationMs = (60 / this.bpm / 4) * 1000; // 16th note step
      this.timerId = window.setInterval(() => {
        if (!this.isPlaying) return;
        this.tickStep();
      }, stepDurationMs);
    };

    startStepTimer();
  }

  public pause() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.customAudioEl) {
      this.customAudioEl.pause();
    }
  }

  public stop() {
    this.pause();
    this.currentStep = this.cueStep;
  }

  public cue() {
    if (this.isPlaying) {
      // If playing, pressing cue stops and rewinds to cue point
      this.pause();
      this.currentStep = this.cueStep;
      this.positionSeconds = (this.cueStep / 4) * (60 / this.bpm);
    } else {
      // If paused, pressing cue sets current position as new cue point
      this.cueStep = this.currentStep;
      // Momentary preview pulse
      this.playStepKick(this.ctx.currentTime);
    }
  }

  public jumpToHotCue(index: number) {
    const targetStep = this.hotCueSteps[index];
    if (targetStep !== null && targetStep !== undefined) {
      this.currentStep = targetStep;
      this.positionSeconds = (this.currentStep / 4) * (60 / this.bpm);
      if (!this.isPlaying) {
        this.play();
      }
    } else {
      // Store current step
      this.hotCueSteps[index] = this.currentStep;
    }
  }

  public setPitch(percent: number) {
    this.pitchPercent = Math.max(-50, Math.min(50, percent));
    this.bpm = this.baseBpm * (1 + this.pitchPercent / 100);
    if (this.customAudioEl) {
      this.customAudioEl.playbackRate = 1 + this.pitchPercent / 100;
    }
    // Update delay time to sync with beat
    const beatSec = 60 / this.bpm;
    this.delayNode.delayTime.setValueAtTime(beatSec * 0.75, this.ctx.currentTime);

    // Restart timer if playing to adapt tempo immediately
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  public syncTo(targetBpm: number) {
    const requiredPitch = ((targetBpm - this.baseBpm) / this.baseBpm) * 100;
    this.setPitch(requiredPitch);
  }

  public setLoop(active: boolean, beats = 4) {
    this.loopActive = active;
    this.loopLengthBeats = beats;
    if (active) {
      this.loopStartStep = Math.floor(this.currentStep / (beats * 4)) * (beats * 4);
    }
  }

  // Audio parameters update
  public setEq(band: 'low' | 'mid' | 'high', value: number) {
    const t = this.ctx.currentTime;
    if (band === 'low') {
      this.lowShelf.gain.setValueAtTime(this.killLow ? -40 : value, t);
    } else if (band === 'mid') {
      this.midPeak.gain.setValueAtTime(this.killMid ? -40 : value, t);
    } else if (band === 'high') {
      this.highShelf.gain.setValueAtTime(this.killHigh ? -40 : value, t);
    }
  }

  public toggleKill(band: 'low' | 'mid' | 'high') {
    const t = this.ctx.currentTime;
    if (band === 'low') {
      this.killLow = !this.killLow;
      this.lowShelf.gain.setValueAtTime(this.killLow ? -40 : 0, t);
    } else if (band === 'mid') {
      this.killMid = !this.killMid;
      this.midPeak.gain.setValueAtTime(this.killMid ? -40 : 0, t);
    } else if (band === 'high') {
      this.killHigh = !this.killHigh;
      this.highShelf.gain.setValueAtTime(this.killHigh ? -40 : 0, t);
    }
  }

  public setSoundFilter(amount: number) {
    // amount: -100 to +100
    const t = this.ctx.currentTime;
    if (Math.abs(amount) < 4) {
      this.soundFilter.type = 'allpass';
    } else if (amount < 0) {
      // Low Pass
      this.soundFilter.type = 'lowpass';
      // from 20000 Hz down to 200 Hz
      const norm = (amount + 100) / 100; // 0 to 1
      const freq = 200 + Math.pow(norm, 2.5) * 19800;
      this.soundFilter.frequency.setValueAtTime(freq, t);
      this.soundFilter.Q.setValueAtTime(2.2, t);
    } else {
      // High Pass
      this.soundFilter.type = 'highpass';
      // from 20 Hz up to 8000 Hz
      const norm = amount / 100; // 0 to 1
      const freq = 20 + Math.pow(norm, 2.2) * 8000;
      this.soundFilter.frequency.setValueAtTime(freq, t);
      this.soundFilter.Q.setValueAtTime(2.2, t);
    }
  }

  public setVolume(vol: number) {
    this.channelGain.gain.setValueAtTime(vol, this.ctx.currentTime);
  }

  public setTrim(gain: number) {
    this.trimGain.gain.setValueAtTime(gain, this.ctx.currentTime);
  }

  public setCrossfadeGain(gain: number) {
    this.crossfadeGain.gain.setValueAtTime(gain, this.ctx.currentTime);
  }

  public setFx(delay: number, reverb: number) {
    const t = this.ctx.currentTime;
    this.delayWet.gain.setValueAtTime(delay, t);
    this.reverbWet.gain.setValueAtTime(reverb, t);
  }

  // Scratch Simulation
  public triggerScratch(intensity: number, forward: boolean) {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    const startFreq = forward ? 180 + intensity * 600 : 800 + intensity * 800;
    const endFreq = forward ? 900 + intensity * 500 : 120;

    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, endFreq), t + 0.14);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.value = 3.5;

    gain.gain.setValueAtTime(0.45 * Math.min(1, intensity + 0.3), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.trimGain);

    osc.start(t);
    osc.stop(t + 0.16);

    // Also nudge current step slightly for realistic vinyl seek
    this.currentStep = Math.max(0, this.currentStep + (forward ? 2 : -2));
  }

  public triggerTurntableBrake() {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.9);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(this.trimGain);
    osc.start(t);
    osc.stop(t + 0.9);

    this.pause();
  }

  public triggerSpinback() {
    const t = this.ctx.currentTime;
    const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.8, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, t);
    filter.frequency.exponentialRampToValueAtTime(4500, t + 0.4);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.8);
    filter.Q.value = 5.0;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trimGain);

    noise.start(t);
    noise.stop(t + 0.8);
  }

  // Synthesis sequencer step
  private tickStep() {
    if (!this.track) return;
    const t = this.ctx.currentTime;
    const step = this.currentStep;

    // Loop check
    if (this.loopActive) {
      const loopSteps = this.loopLengthBeats * 4;
      if (step >= this.loopStartStep + loopSteps) {
        this.currentStep = this.loopStartStep;
      }
    }

    const style = this.track.drumStyle || 'four_on_floor';

    // 1. Kick
    if (style === 'four_on_floor') {
      if (step % 4 === 0) this.playStepKick(t);
    } else if (style === 'breakbeat' || style === 'dnb_stepper') {
      if (step % 16 === 0 || step % 16 === 10) this.playStepKick(t);
    } else if (style === 'trap_808') {
      if (step % 16 === 0 || step % 16 === 7 || step % 16 === 12) this.playStepKick(t);
    }

    // 2. Snare / Clap
    if (style === 'four_on_floor') {
      if (step % 8 === 4) this.playStepSnare(t);
    } else if (style === 'breakbeat') {
      if (step % 16 === 4 || step % 16 === 12) this.playStepSnare(t);
    } else if (style === 'dnb_stepper') {
      if (step % 16 === 4 || step % 16 === 12) this.playStepSnare(t);
    } else if (style === 'trap_808') {
      if (step % 16 === 8) this.playStepSnare(t);
    }

    // 3. Hi-Hats
    if (step % 2 === 0) {
      this.playStepHiHat(t, step % 4 === 2);
    }

    // 4. Bassline
    const bassline = this.track.bassline || [40, 40, 40, 47, 45, 45, 43, 43];
    if (step % 2 === 0) {
      const bassIdx = Math.floor(step / 2) % bassline.length;
      this.playStepBass(t, bassline[bassIdx]);
    }

    // 5. Lead notes
    const leads = this.track.leadNotes || [64, 67, 71, 74, 71, 67, 69, 64];
    const leadIdx = step % leads.length;
    this.playStepLead(t, leads[leadIdx]);

    this.currentStep = (this.currentStep + 1) % 512;
    this.positionSeconds = (this.currentStep / 4) * (60 / this.bpm);
  }

  private playStepKick(t: number) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.frequency.setValueAtTime(145, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.11);

    gain.gain.setValueAtTime(0.85, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.trimGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  private playStepSnare(t: number) {
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1100;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.48, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trimGain);
    noise.start(t);
    noise.stop(t + 0.14);
  }

  private playStepHiHat(t: number, open: boolean) {
    const len = open ? 0.09 : 0.035;
    const bufferSize = this.ctx.sampleRate * len;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 6800;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.22 : 0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + len);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.trimGain);
    noise.start(t);
    noise.stop(t + len);
  }

  private playStepBass(t: number, midiNote: number) {
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(550, t);
    filter.frequency.exponentialRampToValueAtTime(180, t + 0.22);

    gain.gain.setValueAtTime(0.48, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.trimGain);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  private playStepLead(t: number, midiNote: number) {
    const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2200, t);
    filter.Q.value = 2.0;

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.trimGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public getVuLevel(): number {
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const avg = sum / data.length;
    return Math.min(1, avg / 128);
  }
}

// Master DJ Mixer Engine
export class DjMasterEngine {
  private ctx: AudioContext | null = null;
  public deckA!: DeckAudioChannel;
  public deckB!: DeckAudioChannel;
  public masterGain!: GainNode;
  public masterAnalyser!: AnalyserNode;
  
  // Crossfader position (-1 is Deck A 100%, 0 is both, +1 is Deck B 100%)
  private crossfaderPosition = 0;
  public crossfaderCurve: 'smooth' | 'cut' | 'linear' = 'smooth';

  // Live recording
  private mediaDest: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  public isRecording = false;
  public recordedBlobUrl: string | null = null;

  constructor() {
    // Lazily initialized on first user interaction
  }

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new AudioCtx();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.9;

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 512;

    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // Deck channels
    this.deckA = new DeckAudioChannel(this.ctx, this.masterGain);
    this.deckB = new DeckAudioChannel(this.ctx, this.masterGain);

    // Initial tracks
    this.deckA.loadTrack(PRESET_DJ_TRACKS[0]);
    this.deckB.loadTrack(PRESET_DJ_TRACKS[1]);

    this.updateCrossfader(0);
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setCrossfader(val: number) {
    // val is -1 to +1
    this.crossfaderPosition = Math.max(-1, Math.min(1, val));
    this.updateCrossfader(this.crossfaderPosition);
  }

  private updateCrossfader(val: number) {
    if (!this.deckA || !this.deckB) return;
    // Map -1..1 to 0..1
    const x = (val + 1) / 2;
    let gainA = 1;
    let gainB = 1;

    if (this.crossfaderCurve === 'smooth') {
      // Constant power crossfade
      gainA = Math.cos(x * 0.5 * Math.PI);
      gainB = Math.sin(x * 0.5 * Math.PI);
    } else if (this.crossfaderCurve === 'linear') {
      gainA = 1 - x;
      gainB = x;
    } else if (this.crossfaderCurve === 'cut') {
      // Scratch cut curve: instant full on sides
      gainA = x < 0.9 ? 1 : (1 - x) * 10;
      gainB = x > 0.1 ? 1 : x * 10;
    }

    this.deckA.setCrossfadeGain(Math.max(0, Math.min(1, gainA)));
    this.deckB.setCrossfadeGain(Math.max(0, Math.min(1, gainB)));
  }

  public setMasterVolume(vol: number) {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
  }

  // Performance Sampler trigger
  public triggerSample(sampleName: 'airhorn' | 'drop' | 'laser' | 'siren' | 'scratch' | 'boom') {
    this.init();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (sampleName === 'airhorn') {
      // Iconic Reggae/DJ Airhorn chords
      const tones = [587.33, 739.99, 880]; // D5, F#5, A5
      tones.forEach(freq => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.setValueAtTime(freq * 1.04, t + 0.08);
        osc.frequency.setValueAtTime(freq, t + 0.18);

        gain.gain.setValueAtTime(0.3, t);
        gain.gain.setValueAtTime(0.3, t + 0.28);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.35);
      });
    } else if (sampleName === 'laser') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(2400, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.25);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.25);
    } else if (sampleName === 'siren') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(900, t + 0.25);
      osc.frequency.linearRampToValueAtTime(400, t + 0.5);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.linearRampToValueAtTime(0.001, t + 0.5);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.5);
    } else if (sampleName === 'boom') {
      // 808 Sub Boom
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.7);

      gain.gain.setValueAtTime(0.9, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.85);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.85);
    } else if (sampleName === 'scratch') {
      this.deckA?.triggerScratch(0.8, true);
    } else if (sampleName === 'drop') {
      // DJ Vocal style synth drop
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.4);

      gain.gain.setValueAtTime(0.5, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.45);
    }
  }

  // Live DJ Set Recording
  public startRecording() {
    this.init();
    if (!this.ctx || !this.masterGain) return false;

    try {
      this.mediaDest = this.ctx.createMediaStreamDestination();
      this.masterGain.connect(this.mediaDest);

      this.recordedChunks = [];
      const options = MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : undefined;

      this.mediaRecorder = new MediaRecorder(this.mediaDest.stream, options);
      this.mediaRecorder.ondataavailable = e => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        const mime = this.mediaRecorder?.mimeType || 'audio/webm';
        const blob = new Blob(this.recordedChunks, { type: mime });
        this.recordedBlobUrl = URL.createObjectURL(blob);
      };

      this.mediaRecorder.start(200);
      this.isRecording = true;
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      return false;
    }
  }

  public stopRecording(): string | null {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      return this.recordedBlobUrl;
    }
    return null;
  }
}

// Global DJ Engine Singleton instance for cross-component stability
export const djEngine = new DjMasterEngine();
