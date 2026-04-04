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
    description: 'Enhanced low-end punch and warmth',
    bands: [
      { frequency: 60, gain: 8, Q: 0.8, type: 'lowshelf' },
      { frequency: 200, gain: 4, Q: 1.2, type: 'peaking' },
      { frequency: 800, gain: -2, Q: 1.0, type: 'peaking' },
      { frequency: 4000, gain: 0, Q: 1.0, type: 'peaking' },
      { frequency: 12000, gain: -1, Q: 1.0, type: 'highshelf' },
    ],
    noiseReduction: { enabled: false, gateThreshold: -40, highPassFreq: 20, lowPassFreq: 20000 },
  },
  {
    name: 'Vocal Clarity',
    description: 'Crisp vocals with presence boost',
    bands: [
      { frequency: 80, gain: -3, Q: 0.7, type: 'lowshelf' },
      { frequency: 300, gain: -2, Q: 1.5, type: 'peaking' },
      { frequency: 2500, gain: 5, Q: 1.2, type: 'peaking' },
      { frequency: 5000, gain: 3, Q: 1.0, type: 'peaking' },
      { frequency: 10000, gain: 2, Q: 0.8, type: 'highshelf' },
    ],
    noiseReduction: { enabled: true, gateThreshold: -35, highPassFreq: 80, lowPassFreq: 18000 },
  },
  {
    name: 'Treble Boost',
    description: 'Bright, airy highs with shimmer',
    bands: [
      { frequency: 60, gain: -2, Q: 1.0, type: 'lowshelf' },
      { frequency: 250, gain: 0, Q: 1.0, type: 'peaking' },
      { frequency: 2000, gain: 2, Q: 1.0, type: 'peaking' },
      { frequency: 6000, gain: 5, Q: 0.8, type: 'peaking' },
      { frequency: 14000, gain: 7, Q: 0.7, type: 'highshelf' },
    ],
    noiseReduction: { enabled: false, gateThreshold: -40, highPassFreq: 20, lowPassFreq: 20000 },
  },
  {
    name: 'Noise Cut',
    description: 'Aggressive noise reduction with bandwidth limiting',
    bands: [
      { frequency: 80, gain: -6, Q: 0.5, type: 'lowshelf' },
      { frequency: 250, gain: -1, Q: 1.0, type: 'peaking' },
      { frequency: 1000, gain: 0, Q: 1.0, type: 'peaking' },
      { frequency: 4000, gain: 0, Q: 1.0, type: 'peaking' },
      { frequency: 10000, gain: -8, Q: 0.5, type: 'highshelf' },
    ],
    noiseReduction: { enabled: true, gateThreshold: -25, highPassFreq: 100, lowPassFreq: 12000 },
  },
];

export class AudioEngine {
  private context: AudioContext | null = null;
  private source: AudioBufferSourceNode | MediaStreamAudioSourceNode | MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private highPassFilter: BiquadFilterNode | null = null;
  private lowPassFilter: BiquadFilterNode | null = null;
  private mediaElement: HTMLAudioElement | null = null;
  private isPlaying = false;

  async init() {
    if (this.context) return;
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.85;
    this.gainNode = this.context.createGain();

    // Create noise reduction filters
    this.highPassFilter = this.context.createBiquadFilter();
    this.highPassFilter.type = 'highpass';
    this.highPassFilter.frequency.value = 20;

    this.lowPassFilter = this.context.createBiquadFilter();
    this.lowPassFilter.type = 'lowpass';
    this.lowPassFilter.frequency.value = 20000;

    // Create EQ filters
    this.filters = DEFAULT_BANDS.map((band) => {
      const filter = this.context!.createBiquadFilter();
      filter.type = band.type;
      filter.frequency.value = band.frequency;
      filter.gain.value = band.gain;
      filter.Q.value = band.Q;
      return filter;
    });
  }

  private connectChain() {
    if (!this.source || !this.context || !this.analyser || !this.gainNode || !this.highPassFilter || !this.lowPassFilter) return;

    // Disconnect everything
    try { this.source.disconnect(); } catch {}
    this.filters.forEach(f => { try { f.disconnect(); } catch {} });
    try { this.highPassFilter.disconnect(); } catch {}
    try { this.lowPassFilter.disconnect(); } catch {}
    try { this.gainNode.disconnect(); } catch {}

    // Chain: source -> highpass -> filters -> lowpass -> gain -> analyser -> destination
    let current: AudioNode = this.source;
    current.connect(this.highPassFilter);
    current = this.highPassFilter;

    for (const filter of this.filters) {
      current.connect(filter);
      current = filter;
    }

    current.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.gainNode);
    this.gainNode.connect(this.analyser);
    this.analyser.connect(this.context.destination);
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
    if (this.mediaElement) {
      this.mediaElement.pause();
      this.isPlaying = false;
    }
  }

  stop() {
    if (this.mediaElement) {
      this.mediaElement.pause();
      this.mediaElement.currentTime = 0;
    }
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
    if (!filter) return;
    filter.type = band.type;
    filter.frequency.value = band.frequency;
    filter.gain.value = band.enabled ? band.gain : 0;
    filter.Q.value = band.Q;
  }

  updateNoiseReduction(nr: NoiseReduction) {
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

  getSampleRate(): number {
    return this.context?.sampleRate ?? 44100;
  }

  getFrequencyResponse(): { frequencies: Float32Array; magnitudes: Float32Array } {
    const len = 512;
    const frequencies = new Float32Array(len);
    const magnitudes = new Float32Array(len);
    const phases = new Float32Array(len);
    const combined = new Float32Array(len).fill(0);

    for (let i = 0; i < len; i++) {
      frequencies[i] = 20 * Math.pow(20000 / 20, i / (len - 1));
    }

    for (const filter of this.filters) {
      const mag = new Float32Array(len);
      const phase = new Float32Array(len);
      filter.getFrequencyResponse(frequencies, mag, phase);
      for (let i = 0; i < len; i++) {
        combined[i] += 20 * Math.log10(mag[i]);
      }
    }

    return { frequencies, magnitudes: combined };
  }

  destroy() {
    this.stop();
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }
}
