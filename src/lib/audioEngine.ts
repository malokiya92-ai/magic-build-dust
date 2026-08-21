export interface EQBand {
  id: number;
  frequency: number;
  gain: number;
  Q: number;
  type: BiquadFilterType;
  enabled: boolean;
}

export interface NoiseReduction {
  enabled: boolean;
  gateThreshold: number; // dB
  highPassFreq: number;
  lowPassFreq: number;
}

export interface Preset {
  name: string;
  description: string;
  bands: Omit<EQBand, 'id' | 'enabled'>[];
  noiseReduction: NoiseReduction;
}

export const DEFAULT_BANDS: EQBand[] = [
  { id: 0, frequency: 60, gain: 0, Q: 1.0, type: 'lowshelf', enabled: true },
  { id: 1, frequency: 250, gain: 0, Q: 1.0, type: 'peaking', enabled: true },
  { id: 2, frequency: 1000, gain: 0, Q: 1.0, type: 'peaking', enabled: true },
  { id: 3, frequency: 4000, gain: 0, Q: 1.0, type: 'peaking', enabled: true },
  { id: 4, frequency: 12000, gain: 0, Q: 1.0, type: 'highshelf', enabled: true },
];

export const DEFAULT_NOISE_REDUCTION: NoiseReduction = {
  enabled: false,
  gateThreshold: -40,
  highPassFreq: 20,
  lowPassFreq: 20000,
};

// Presets pushed to ±12 dB so the effect is immediately, unmistakably audible.
export const PRESETS: Preset[] = [
  {
    name: 'Flat',
    description: 'No modification — transparent pass-through',
    bands: [
      { frequency: 60, gain: 0, Q: 1.0, type: 'lowshelf' },
      { frequency: 250, gain: 0, Q: 1.0, type: 'peaking' },
      { frequency: 1000, gain: 0, Q: 1.0, type: 'peaking' },
      { frequency: 4000, gain: 0, Q: 1.0, type: 'peaking' },
      { frequency: 12000, gain: 0, Q: 1.0, type: 'highshelf' },
    ],
    noiseReduction: { enabled: false, gateThreshold: -40, highPassFreq: 20, lowPassFreq: 20000 },
  },
  {
    name: 'Bass Boost',
    description: 'Massive +12 dB sub punch — you WILL hear it',
    bands: [
      { frequency: 80, gain: 12, Q: 0.7, type: 'lowshelf' },
      { frequency: 200, gain: 8, Q: 1.0, type: 'peaking' },
      { frequency: 1000, gain: -4, Q: 1.0, type: 'peaking' },
      { frequency: 4000, gain: -6, Q: 1.0, type: 'peaking' },
      { frequency: 12000, gain: -12, Q: 0.7, type: 'highshelf' },
    ],
    noiseReduction: { enabled: false, gateThreshold: -40, highPassFreq: 20, lowPassFreq: 20000 },
  },
  {
    name: 'Vocal Clarity',
    description: '+12 dB presence band — vocals jump out',
    bands: [
      { frequency: 80, gain: -10, Q: 0.7, type: 'lowshelf' },
      { frequency: 300, gain: -6, Q: 1.5, type: 'peaking' },
      { frequency: 2500, gain: 12, Q: 1.2, type: 'peaking' },
      { frequency: 5000, gain: 10, Q: 1.0, type: 'peaking' },
      { frequency: 10000, gain: 6, Q: 0.8, type: 'highshelf' },
    ],
    noiseReduction: { enabled: true, gateThreshold: -35, highPassFreq: 100, lowPassFreq: 16000 },
  },
  {
    name: 'Treble Boost',
    description: '+12 dB shimmer — bright and airy',
    bands: [
      { frequency: 60, gain: -8, Q: 1.0, type: 'lowshelf' },
      { frequency: 250, gain: -4, Q: 1.0, type: 'peaking' },
      { frequency: 2000, gain: 4, Q: 1.0, type: 'peaking' },
      { frequency: 6000, gain: 10, Q: 0.8, type: 'peaking' },
      { frequency: 14000, gain: 12, Q: 0.7, type: 'highshelf' },
    ],
    noiseReduction: { enabled: false, gateThreshold: -40, highPassFreq: 20, lowPassFreq: 20000 },
  },
  {
    name: 'Noise Cut',
    description: 'Aggressive gate + bandwidth limiting',
    bands: [
      { frequency: 80, gain: -12, Q: 0.5, type: 'lowshelf' },
      { frequency: 250, gain: -4, Q: 1.0, type: 'peaking' },
      { frequency: 1000, gain: 2, Q: 1.0, type: 'peaking' },
      { frequency: 4000, gain: 0, Q: 1.0, type: 'peaking' },
      { frequency: 10000, gain: -12, Q: 0.5, type: 'highshelf' },
    ],
    noiseReduction: { enabled: true, gateThreshold: -25, highPassFreq: 120, lowPassFreq: 10000 },
  },
];

export class AudioEngine {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private inputAnalyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private gateGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private mediaElement: HTMLAudioElement | null = null;
  private isPlaying = false;
  private bypassed = false;
  private noiseReduction: NoiseReduction = { ...DEFAULT_NOISE_REDUCTION };
  private gateRAF = 0;

  async init() {
    if (this.context) return;
    this.context = new AudioContext();

    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;

    this.inputAnalyser = this.context.createAnalyser();
    this.inputAnalyser.fftSize = 2048;
    this.inputAnalyser.smoothingTimeConstant = 0.85;

    this.gainNode = this.context.createGain();
    this.gateGain = this.context.createGain();
    this.gateGain.gain.value = 1;
    this.dryGain = this.context.createGain();
    this.wetGain = this.context.createGain();
    this.dryGain.gain.value = 0;
    this.wetGain.gain.value = 1;

    this.highPassFilter = this.context.createBiquadFilter();
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.value = 20;
    this.highPassFilter.Q.value = 0.707;

    this.lowPassFilter = this.context.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.value = 20000;
    this.lowPassFilter.Q.value = 0.707;

    // EQ filter chain — persisted on this instance (NOT recreated per render).
    this.filters = DEFAULT_BANDS.map((band) => {
      const filter = this.context!.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.setValueAtTime(band.frequency, this.context!.currentTime);
      filter.gain.setValueAtTime(band.gain, this.context!.currentTime);
      filter.Q.setValueAtTime(band.Q, this.context!.currentTime);
      return filter;
    });

    this.startGateLoop();
  }

  private startGateLoop() {
    const tick = () => {
      if (!this.inputAnalyser || !this.gateGain || !this.context) return;
      if (this.noiseReduction.enabled) {
        const rms = this.computeRMSdB(this.inputAnalyser);
        // Real gate: ramp gain to 0 below threshold, 1 above. Interrupts the stream.
        const target = rms < this.noiseReduction.gateThreshold ? 0 : 1;
        this.gateGain.gain.setTargetAtTime(target, this.context.currentTime, 0.01);
      } else {
        this.gateGain.gain.setTargetAtTime(1, this.context.currentTime, 0.005);
      }
      this.gateRAF = requestAnimationFrame(tick);
    };
    this.gateRAF = requestAnimationFrame(tick);
  }

  private computeRMSdB(node: AnalyserNode): number {
    const buf = new Uint8Array(node.fftSize);
    node.getByteTimeDomainData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = (buf[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);
    if (rms <= 0.0001) return -80;
    return 20 * Math.log10(rms);
  }

  getInputRMSdB(): number {
    return this.inputAnalyser ? this.computeRMSdB(this.inputAnalyser) : -80;
  }
  getOutputRMSdB(): number {
    return this.analyser ? this.computeRMSdB(this.analyser) : -80;
  }

  private connectChain() {
    if (!this.source || !this.context || !this.analyser || !this.inputAnalyser ||
        !this.gainNode || !this.gateGain || !this.dryGain || !this.wetGain ||
        !this.highPassFilter || !this.lowPassFilter) return;

    try { this.source.disconnect(); } catch {}
    this.filters.forEach(f => { try { f.disconnect(); } catch {} });
    try { this.highPassFilter.disconnect(); } catch {}
    try { this.lowPassFilter.disconnect(); } catch {}
    try { this.gainNode.disconnect(); } catch {}
    try { this.gateGain.disconnect(); } catch {}
    try { this.inputAnalyser.disconnect(); } catch {}
    try { this.dryGain.disconnect(); } catch {}
    try { this.wetGain.disconnect(); } catch {}
    try { this.analyser.disconnect(); } catch {}

    // Input tap (drives input analyser + gate detection)
    this.source.connect(this.inputAnalyser);

    // DRY path: source → dryGain → destination
    this.source.connect(this.dryGain);
    this.dryGain.connect(this.context.destination);

    // WET path:
    // source → HPF → band1 → band2 → band3 → band4 → band5 → LPF → gate → gain → analyser → wetGain → destination
    let current: AudioNode = this.source;
    current.connect(this.highPassFilter);
    current = this.highPassFilter;
    for (const filter of this.filters) {
      current.connect(filter);
      current = filter;
    }
    current.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.gateGain);
    this.gateGain.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.wetGain);
    this.wetGain.connect(this.context.destination);
  }

  setBypassed(bypassed: boolean) {
    this.bypassed = bypassed;
    if (this.dryGain && this.wetGain && this.context) {
      const now = this.context.currentTime;
      // Swap dry/wet in real time
      this.dryGain.gain.setTargetAtTime(bypassed ? 1 : 0, now, 0.01);
      this.wetGain.gain.setTargetAtTime(bypassed ? 0 : 1, now, 0.01);
    }
  }

  getBypassed() { return this.bypassed; }

  /** Master output trim in dB (-24 .. +12) */
  setMasterGain(db: number) {
    this.masterGainDb = db;
    if (this.gainNode && this.context) {
      this.gainNode.gain.setTargetAtTime(Math.pow(10, db / 20), this.context.currentTime, 0.01);
    }
  }

  getMasterGain() { return this.masterGainDb; }


  getInputFrequencyData(): Uint8Array {
    if (!this.inputAnalyser) return new Uint8Array(0);
    const data = new Uint8Array(this.inputAnalyser.frequencyBinCount);
    this.inputAnalyser.getByteFrequencyData(data);
    return data;
  }
  getInputTimeDomainData(): Uint8Array {
    if (!this.inputAnalyser) return new Uint8Array(0);
    const data = new Uint8Array(this.inputAnalyser.frequencyBinCount);
    this.inputAnalyser.getByteTimeDomainData(data);
    return data;
  }

  async loadFile(file: File): Promise<number> {
    await this.init();
    this.stop();
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      this.mediaElement = new Audio(url);
      this.mediaElement.crossOrigin = 'anonymous';
      this.mediaElement.addEventListener('loadedmetadata', () => {
        this.source = this.context!.createMediaElementSource(this.mediaElement!);
        this.connectChain();
        resolve(this.mediaElement!.duration);
      });
      this.mediaElement.load();
    });
  }

  async loadMicrophone(): Promise<void> {
    await this.init();
    this.stop();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.source = this.context!.createMediaStreamSource(stream);
    this.connectChain();
    this.isPlaying = true;
  }

  play() {
    if (this.mediaElement) {
      if (this.context?.state === 'suspended') this.context.resume();
      this.mediaElement.play();
      this.isPlaying = true;
    }
  }
  pause() {
    if (this.mediaElement) { this.mediaElement.pause(); this.isPlaying = false; }
  }
  stop() {
    if (this.mediaElement) { this.mediaElement.pause(); this.mediaElement.currentTime = 0; }
    if (this.source && 'mediaStream' in this.source) {
      (this.source as MediaStreamAudioSourceNode).mediaStream.getTracks().forEach(t => t.stop());
    }
    this.isPlaying = false;
  }
  getIsPlaying() { return this.isPlaying; }
  getCurrentTime() { return this.mediaElement?.currentTime ?? 0; }
  getDuration() { return this.mediaElement?.duration ?? 0; }
  seekTo(time: number) { if (this.mediaElement) this.mediaElement.currentTime = time; }

  updateBand(index: number, band: EQBand) {
    const filter = this.filters[index];
    if (!filter || !this.context) return;
    const now = this.context.currentTime;
    filter.type = band.type;
    filter.frequency.setValueAtTime(band.frequency, now);
    filter.gain.setValueAtTime(band.enabled ? band.gain : 0, now);
    filter.Q.setValueAtTime(band.Q, now);
  }

  updateNoiseReduction(nr: NoiseReduction) {
    this.noiseReduction = { ...nr };
    if (this.highPassFilter) {
      this.highPassFilter.frequency.value = nr.enabled ? nr.highPassFreq : 20;
    }
    if (this.lowPassFilter) {
      this.lowPassFilter.frequency.value = nr.enabled ? nr.lowPassFreq : 20000;
    }
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }
  getTimeDomainData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(data);
    return data;
  }
  getSampleRate(): number { return this.context?.sampleRate ?? 44100; }

  getFrequencyResponse(): { frequencies: Float32Array; magnitudes: Float32Array } {
    const len = 512;
    const frequencies = new Float32Array(len);
    const combined = new Float32Array(len).fill(0);
    for (let i = 0; i < len; i++) {
      frequencies[i] = 20 * Math.pow(20000 / 20, i / (len - 1));
    }
    for (const filter of this.filters) {
      const mag = new Float32Array(len);
      const phase = new Float32Array(len);
      filter.getFrequencyResponse(frequencies, mag, phase);
      for (let i = 0; i < len; i++) combined[i] += 20 * Math.log10(mag[i]);
    }
    return { frequencies, magnitudes: combined };
  }

  destroy() {
    this.stop();
    cancelAnimationFrame(this.gateRAF);
    if (this.context) { this.context.close(); this.context = null; }
  }
}
