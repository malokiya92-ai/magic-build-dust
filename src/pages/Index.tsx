import { useState, useRef, useCallback, useEffect } from 'react';
import { AudioEngine, EQBand, NoiseReduction, DEFAULT_BANDS, DEFAULT_NOISE_REDUCTION, PRESETS } from '@/lib/audioEngine';
import SpectrumAnalyzer from '@/components/SpectrumAnalyzer';
import EQCurveDisplay from '@/components/EQCurveDisplay';
import BandControl from '@/components/BandControl';
import PresetSelector from '@/components/PresetSelector';
import NoiseReductionPanel from '@/components/NoiseReductionPanel';
import TransportBar from '@/components/TransportBar';
import ComparisonView from '@/components/ComparisonView';
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
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground tracking-tight">
              SP<span className="text-primary text-glow">09</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono tracking-wider">PARAMETRIC EQ &amp; NOISE PROFILER</p>
          </div>
        </div>

        {/* Transport */}
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

        {/* Visualizations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl surface-elevated border border-border/50">
            <h2 className="font-mono text-xs text-muted-foreground mb-3 tracking-wider">SPECTRUM</h2>
            <div className="h-32">
              <SpectrumAnalyzer engine={engineRef.current} isActive={isActive && isPlaying} />
            </div>
          </div>
          <div className="p-4 rounded-xl surface-elevated border border-border/50">
            <h2 className="font-mono text-xs text-muted-foreground mb-3 tracking-wider">EQ RESPONSE</h2>
            <div className="h-32 md:h-48">
              <EQCurveDisplay engine={engineRef.current} bands={bands} />
            </div>
          </div>
        </div>

        {/* Input vs Output comparison */}
        <div className="p-4 rounded-xl surface-elevated border border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-mono text-xs text-muted-foreground tracking-wider">INPUT vs OUTPUT</h2>
              <p className="text-[10px] text-muted-foreground/70 font-mono mt-0.5">
                A/B compare the dry source against the processed signal — visually and audibly.
              </p>
            </div>
            <Button
              variant={bypassed ? 'outline' : 'default'}
              size="sm"
              onClick={handleBypassToggle}
              disabled={!isActive}
              className="font-mono text-xs tracking-wider gap-2"
            >
              <Power className="w-3.5 h-3.5" />
              {bypassed ? 'BYPASS (DRY)' : 'PROCESSING (WET)'}
            </Button>
          </div>
          <ComparisonView engine={engineRef.current} isActive={isActive && isPlaying} />
        </div>

        <div>
          <h2 className="font-mono text-xs text-muted-foreground mb-3 tracking-wider">PRESETS</h2>
          <PresetSelector activePreset={activePreset} onSelect={handlePresetSelect} />
          <p className="text-xs text-muted-foreground mt-2 font-mono">{PRESETS[activePreset].description}</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Band controls */}
          <div>
            <h2 className="font-mono text-xs text-muted-foreground mb-3 tracking-wider">BANDS</h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {bands.map((band, i) => (
                <BandControl key={i} band={band} index={i} onChange={handleBandChange} />
              ))}
            </div>
          </div>

          {/* Noise reduction */}
          <NoiseReductionPanel settings={noiseReduction} onChange={handleNoiseReductionChange} />
        </div>
      </div>
    </div>
  );
};

export default Index;
