// Web Audio procedural synthesizer for generative music playback
export interface MusicTrackSpec {
  title: string;
  artist?: string;
  genre: string;
  bpm: number;
  key?: string;
  mood?: string;
  description?: string;
  structure?: Array<{ name: string; energy: number }>;
  chordProgression?: string[];
  leadNotes?: number[];
  bassline?: number[];
  lyrics?: string;
  synthParams?: {
    filterCutoff?: number;
    resonance?: number;
    reverbDecay?: number;
    oscillatorType?: 'sawtooth' | 'square' | 'triangle' | 'sine';
    tempoMultiplier?: number;
  };
  vocalAudioBase64?: string | null;
  stems?: Array<{ name: string; type: string; pan?: number }>;
  trebloTags?: string[];
  platformEngine?: 'treblo' | 'flowmusic' | 'ainanomusic' | 'synth';
  aiNanoDetails?: {
    contestCategory?: string;
    prizePoolXno?: string;
    creatorRewardPercent?: number;
    nanoAddressDemo?: string;
    votesCount?: number;
    audioBpsFormat?: string;
  };
  flowMusicDetails?: {
    model?: string;
    synthIdVerified?: boolean;
    veoVideoPrompt?: string;
    variationA?: string;
    variationB?: string;
  };
}

// Convert MIDI note number to frequency in Hz
export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class ProceduralSynthesizer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private timerId: number | null = null;
  private analyser: AnalyserNode | null = null;
  private currentStep = 0;
  private vocalAudio: HTMLAudioElement | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public play(track: MusicTrackSpec, onStep?: (step: number) => void) {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.analyser) return;

    this.isPlaying = true;
    this.currentStep = 0;

    const bpm = track.bpm || 120;
    const stepDurationMs = (60 / bpm / 4) * 1000; // 16th notes
    const leadNotes = track.leadNotes && track.leadNotes.length > 0
      ? track.leadNotes
      : [69, 71, 72, 76, 74, 72, 71, 67];
    const bassline = track.bassline && track.bassline.length > 0
      ? track.bassline
      : [45, 45, 41, 41, 48, 48, 43, 43];

    const oscType = track.synthParams?.oscillatorType || 'sawtooth';
    const cutoff = track.synthParams?.filterCutoff || 2800;

    // Optional vocal playback
    if (track.vocalAudioBase64) {
      try {
        const audioUrl = `data:audio/wav;base64,${track.vocalAudioBase64}`;
        this.vocalAudio = new Audio(audioUrl);
        this.vocalAudio.volume = 0.85;
        this.vocalAudio.play().catch(e => console.warn('Vocal playback error:', e));
      } catch (err) {
        console.warn('Vocal setup error:', err);
      }
    }

    this.timerId = window.setInterval(() => {
      if (!this.isPlaying || !this.ctx) return;
      const t = this.ctx.currentTime;
      const step = this.currentStep;

      // 1. Kick on beats 0, 4, 8, 12
      if (step % 4 === 0) {
        this.playKick(t);
      }

      // 2. Snare / Clap on beats 4, 12
      if (step % 8 === 4) {
        this.playSnare(t);
      }

      // 3. Hi-hat on every odd 16th or 8th
      if (step % 2 === 0) {
        this.playHiHat(t, step % 4 === 2);
      }

      // 4. Bass note
      if (step % 2 === 0) {
        const bassIdx = Math.floor(step / 2) % bassline.length;
        const note = bassline[bassIdx];
        this.playBassNote(t, note);
      }

      // 5. Arpeggio / Lead note
      const leadIdx = step % leadNotes.length;
      const leadNote = leadNotes[leadIdx];
      this.playLeadNote(t, leadNote, oscType, cutoff);

      if (onStep) onStep(step);
      this.currentStep = (this.currentStep + 1) % 32;
    }, stepDurationMs);
  }

  private playKick(t: number) {
    if (!this.ctx || !this.analyser) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.analyser);

    osc.start(t);
    osc.stop(t + 0.25);
  }

  private playSnare(t: number) {
    if (!this.ctx || !this.analyser) return;
    // Noise buffer
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    noise.start(t);
    noise.stop(t + 0.15);
  }

  private playHiHat(t: number, open: boolean) {
    if (!this.ctx || !this.analyser) return;
    const bufferSize = this.ctx.sampleRate * (open ? 0.08 : 0.03);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(open ? 0.18 : 0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.08 : 0.03));

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    noise.start(t);
    noise.stop(t + (open ? 0.08 : 0.03));
  }

  private playBassNote(t: number, midiNote: number) {
    if (!this.ctx || !this.analyser) return;
    const freq = midiToFreq(midiNote);
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    osc.start(t);
    osc.stop(t + 0.22);
  }

  private playLeadNote(t: number, midiNote: number, type: OscillatorType, cutoff: number) {
    if (!this.ctx || !this.analyser) return;
    const freq = midiToFreq(midiNote);
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, t);
    filter.Q.value = 4;

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.analyser);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  public stop() {
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.vocalAudio) {
      this.vocalAudio.pause();
      this.vocalAudio = null;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  public async exportWav(track: MusicTrackSpec, totalSeconds: number = 16): Promise<Blob> {
    const sampleRate = 44100;
    const OfflineCtx = window.OfflineAudioContext || (window as any).webkitOfflineAudioContext;
    const offline = new OfflineCtx(2, sampleRate * totalSeconds, sampleRate);

    const bpm = track.bpm || 120;
    const stepDuration = 60 / bpm / 4;
    const totalSteps = Math.floor(totalSeconds / stepDuration);

    const leadNotes = track.leadNotes && track.leadNotes.length > 0 ? track.leadNotes : [69, 71, 72, 76, 74, 72, 71, 67];
    const bassline = track.bassline && track.bassline.length > 0 ? track.bassline : [45, 45, 41, 41, 48, 48, 43, 43];
    const oscType = track.synthParams?.oscillatorType || 'sawtooth';
    const cutoff = track.synthParams?.filterCutoff || 2800;

    for (let step = 0; step < totalSteps; step++) {
      const t = step * stepDuration;

      // Kick
      if (step % 4 === 0) {
        const osc = offline.createOscillator();
        const gain = offline.createGain();
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);
        gain.gain.setValueAtTime(0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(offline.destination);
        osc.start(t);
        osc.stop(t + 0.25);
      }

      // Snare
      if (step % 8 === 4) {
        const bufSize = Math.floor(sampleRate * 0.15);
        const buffer = offline.createBuffer(1, bufSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = offline.createBufferSource();
        noise.buffer = buffer;
        const filter = offline.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        const gain = offline.createGain();
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(offline.destination);
        noise.start(t);
        noise.stop(t + 0.15);
      }

      // Hi-hat
      if (step % 2 === 0) {
        const open = step % 4 === 2;
        const bufSize = Math.floor(sampleRate * (open ? 0.08 : 0.03));
        const buffer = offline.createBuffer(1, bufSize, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = offline.createBufferSource();
        noise.buffer = buffer;
        const filter = offline.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 7000;
        const gain = offline.createGain();
        gain.gain.setValueAtTime(open ? 0.18 : 0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (open ? 0.08 : 0.03));
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(offline.destination);
        noise.start(t);
        noise.stop(t + (open ? 0.08 : 0.03));
      }

      // Bass
      if (step % 2 === 0) {
        const bassIdx = Math.floor(step / 2) % bassline.length;
        const note = bassline[bassIdx];
        const freq = midiToFreq(note);
        const osc = offline.createOscillator();
        const filter = offline.createBiquadFilter();
        const gain = offline.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, t);
        filter.frequency.exponentialRampToValueAtTime(200, t + 0.2);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offline.destination);
        osc.start(t);
        osc.stop(t + 0.22);
      }

      // Lead Note
      const leadIdx = step % leadNotes.length;
      const leadNote = leadNotes[leadIdx];
      const freq = midiToFreq(leadNote);
      const osc = offline.createOscillator();
      const filter = offline.createBiquadFilter();
      const gain = offline.createGain();
      osc.type = oscType;
      osc.frequency.setValueAtTime(freq, t);
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(cutoff, t);
      filter.Q.value = 4;
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(offline.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    }

    const renderedBuffer = await offline.startRendering();

    // Encode to WAV format
    return bufferToWavBlob(renderedBuffer);
  }
}

function bufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const length = buffer.length * blockAlign;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  // RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(view, 8, 'WAVE');

  // fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, length, true);

  // Write channel data interleaved
  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

export const audioSynth = new ProceduralSynthesizer();
