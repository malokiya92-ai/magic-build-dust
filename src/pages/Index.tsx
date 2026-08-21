import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioEngine, EQBand, NoiseReduction, DEFAULT_BANDS, DEFAULT_NOISE_REDUCTION, PRESETS } from '@/lib/audioEngine';
import SpectrumAnalyzer from '@/components/SpectrumAnalyzer';
import EQCurveDisplay from '@/components/EQCurveDisplay';
import BandControl from '@/components/BandControl';
import PresetSelector from '@/components/PresetSelector';
import NoiseReductionPanel from '@/components/NoiseReductionPanel';
import TransportBar from '@/components/TransportBar';
import ComparisonView from '@/components/ComparisonView';
import LevelMeters from '@/components/LevelMeters';
import MasterOutputPanel from '@/components/MasterOutputPanel';
import { Activity, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const engineRef = useRef<AudioEngine | null>(null);
  const [bands, setBands] = useState<EQBand[]>(DEFAULT_BANDS);
  const [noiseReduction, setNoiseReduction] = useState<NoiseReduction>(DEFAULT_NOISE_REDUCTION);
  const [activePreset, setActivePreset] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sourceType, setSourceType] = useState<'file' | 'mic' | null>(null);
  const [fileName, setFileName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [bypassed, setBypassed] = useState(false);

  const handleBypassToggle = useCallback(() => {
    setBypassed(prev => {
      const next = !prev;
      engineRef.current?.setBypassed(next);
      return next;
    });
  }, []);

  const getEngine = useCallback(async () => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine();
      await engineRef.current.init();
    }
    return engineRef.current;
  }, []);

  const handleBandChange = useCallback((index: number, band: EQBand) => {
    setBands(prev => {
      const next = [...prev];
      next[index] = band;
      return next;
    });
    engineRef.current?.updateBand(index, band);
  }, []);

  const handleNoiseReductionChange = useCallback((nr: NoiseReduction) => {
    setNoiseReduction(nr);
    engineRef.current?.updateNoiseReduction(nr);
  }, []);

  const handlePresetSelect = useCallback((index: number) => {
    setActivePreset(index);
    const preset = PRESETS[index];
    const newBands = preset.bands.map((b, i) => ({ ...b, id: i, enabled: true }));
    setBands(newBands);
    newBands.forEach((b, i) => engineRef.current?.updateBand(i, b));
    setNoiseReduction(preset.noiseReduction);
    engineRef.current?.updateNoiseReduction(preset.noiseReduction);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    const engine = await getEngine();
    await engine.loadFile(file);
    setSourceType('file');
    setFileName(file.name);
    setIsActive(true);
  }, [getEngine]);

  const handleMicToggle = useCallback(async () => {
    if (sourceType === 'mic') {
      engineRef.current?.stop();
      setSourceType(null);
      setIsPlaying(false);
      setIsActive(false);
      return;
    }
    const engine = await getEngine();
    await engine.loadMicrophone();
    setSourceType('mic');
    setIsPlaying(true);
    setIsActive(true);
    setFileName('');
  }, [sourceType, getEngine]);

  const handlePlay = useCallback(() => {
    engineRef.current?.play();
    setIsPlaying(true);
    setIsActive(true);
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const handleStop = useCallback(() => {
    engineRef.current?.stop();
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => engineRef.current?.destroy();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 md:px-6 h-16">
          <div className="p-2 rounded-md bg-primary/15 border border-primary/30">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="leading-tight">
            <h1 className="brand-wordmark text-xl md:text-2xl">
              Sp&middot;09
            </h1>
            <p className="panel-label">Parametric EQ &amp; Noise Profiler</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className={`flex items-center gap-2 panel-label ${isPlaying ? 'text-primary' : ''}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isPlaying ? 'bg-primary animate-pulse' : 'bg-muted-foreground/50'}`} />
              {isPlaying ? 'Live' : 'Idle'}
            </span>
            <Button
              variant={bypassed ? 'outline' : 'default'}
              size="sm"
              onClick={handleBypassToggle}
              disabled={!isActive}
              className="font-mono text-[11px] tracking-wider gap-2"
            >
              <Power className="w-3.5 h-3.5" />
              {bypassed ? 'DRY' : 'WET'}
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Side rail */}
        <aside className="lg:w-[300px] lg:shrink-0 lg:h-[calc(100vh-4rem)] lg:sticky lg:top-16 lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-border/60 p-4 space-y-5">
          <TransportBar
            isPlaying={isPlaying}
            hasSource={sourceType !== null}
            sourceType={sourceType}
            fileName={fileName}
            onPlay={handlePlay}
            onPause={handlePause}
            onStop={handleStop}
            onFileSelect={handleFileSelect}
            onMicToggle={handleMicToggle}
          />

          <div>
            <h2 className="panel-label mb-3">Presets</h2>
            <PresetSelector activePreset={activePreset} onSelect={handlePresetSelect} />
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">{PRESETS[activePreset].description}</p>
          </div>

          <NoiseReductionPanel settings={noiseReduction} onChange={handleNoiseReductionChange} />

          <MasterOutputPanel gainDb={masterGain} onChange={handleMasterGainChange} />
        </aside>

        {/* Main panels */}
        <main className="flex-1 min-w-0 p-4 md:p-6 space-y-5">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <section className="p-4 rounded-lg surface-elevated border border-border/60">
              <h2 className="panel-label mb-3">Spectrum</h2>
              <div className="h-32">
                <SpectrumAnalyzer engine={engineRef.current} isActive={isActive && isPlaying} />
              </div>
            </section>
            <section className="p-4 rounded-lg surface-elevated border border-border/60">
              <h2 className="panel-label mb-3">EQ Response</h2>
              <div className="h-32">
                <EQCurveDisplay engine={engineRef.current} bands={bands} />
              </div>
            </section>
          </div>

          <section className="p-4 rounded-lg surface-elevated border border-border/60">
            <div className="mb-3">
              <h2 className="panel-label">Input vs Output</h2>
              <p className="text-[11px] text-muted-foreground/70 mt-1">
                A/B compare the dry source against the processed signal — visually and audibly.
              </p>
            </div>
            <div className="mb-3">
              <LevelMeters engine={engineRef.current} isActive={isActive && isPlaying} />
            </div>
            <ComparisonView engine={engineRef.current} isActive={isActive && isPlaying} />
          </section>

          <section className="p-4 rounded-lg surface-elevated border border-border/60">
            <h2 className="panel-label mb-3">Bands</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {bands.map((band, i) => (
                <BandControl key={i} band={band} index={i} onChange={handleBandChange} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
