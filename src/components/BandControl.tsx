import { EQBand } from '@/lib/audioEngine';
import { Slider } from '@/components/ui/slider';

interface Props {
  band: EQBand;
  index: number;
  onChange: (index: number, band: EQBand) => void;
}

const BAND_COLORS = [
  'bg-band-1',
  'bg-band-2',
  'bg-band-3',
  'bg-band-4',
  'bg-band-5',
];

const BAND_TEXT_COLORS = [
  'text-band-1',
  'text-band-2',
  'text-band-3',
  'text-band-4',
  'text-band-5',
];

const BandControl = ({ band, index, onChange }: Props) => {
  const formatFreq = (f: number) => f >= 1000 ? `${(f / 1000).toFixed(1)}k` : `${Math.round(f)}`;

  return (
    <div className={`flex flex-col items-center gap-3 p-3 rounded-xl surface-elevated border border-border/50 min-w-[90px] transition-opacity ${!band.enabled ? 'opacity-40' : ''}`}>
      <button
        onClick={() => onChange(index, { ...band, enabled: !band.enabled })}
        className={`w-3 h-3 rounded-full ${BAND_COLORS[index]} transition-all ${band.enabled ? 'scale-100' : 'scale-75 opacity-50'}`}
      />

      <span className={`font-mono text-xs ${BAND_TEXT_COLORS[index]}`}>
        {formatFreq(band.frequency)} Hz
      </span>

      <div className="h-32 flex items-center">
        <Slider
          orientation="vertical"
          min={-12}
          max={12}
          step={0.5}
          value={[band.gain]}
          onValueChange={([v]) => onChange(index, { ...band, gain: v })}
          className="h-full"
        />
      </div>

      <span className="font-mono text-xs text-muted-foreground">
        {band.gain > 0 ? '+' : ''}{band.gain.toFixed(1)} dB
      </span>

      <div className="flex flex-col items-center gap-1 w-full">
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Q</span>
        <Slider
          min={0.1}
          max={10}
          step={0.1}
          value={[band.Q]}
          onValueChange={([v]) => onChange(index, { ...band, Q: v })}
          className="w-full"
        />
        <span className="font-mono text-[10px] text-muted-foreground">{band.Q.toFixed(1)}</span>
      </div>
    </div>
  );
};

export default BandControl;
