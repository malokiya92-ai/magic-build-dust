import { EQBand } from '@/lib/audioEngine';
import { Slider } from '@/components/ui/slider';

interface Props {
  band: EQBand;
  index: number;
  onChange: (index: number, band: EQBand) => void;
}

const BAND_VARS = [
  'var(--band-1)',
  'var(--band-2)',
  'var(--band-3)',
  'var(--band-4)',
  'var(--band-5)',
];

const BandControl = ({ band, index, onChange }: Props) => {
  const formatFreq = (f: number) => (f >= 1000 ? `${(f / 1000).toFixed(1)}k` : `${Math.round(f)}`);
  const c = `hsl(${BAND_VARS[index]})`;

  return (
    <div
      className={`group relative flex-1 min-w-[130px] flex flex-col items-center gap-3 pt-5 pb-4 px-3 panel panel-hover overflow-hidden hover:-translate-y-0.5 ${
        !band.enabled ? 'opacity-45' : ''
      }`}
      style={{ ['--tw-ring-color' as string]: c }}
    >
      {/* colored top cap */}
      <span
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${c}, transparent)`, opacity: band.enabled ? 0.9 : 0.3 }}
      />
      {/* tinted ambient wash */}
      <span
        className="pointer-events-none absolute -top-16 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: c, opacity: band.enabled ? 0.16 : 0.04 }}
      />

      <button
        onClick={() => onChange(index, { ...band, enabled: !band.enabled })}
        aria-label={`Toggle band ${formatFreq(band.frequency)} Hz`}
        className="relative z-10 h-3 w-3 rounded-full transition-all"
        style={{
          background: c,
          boxShadow: band.enabled ? `0 0 12px ${c}` : 'none',
          transform: band.enabled ? 'scale(1)' : 'scale(0.7)',
          opacity: band.enabled ? 1 : 0.5,
        }}
      />

      <span className="relative z-10 font-mono text-base tabular-nums" style={{ color: c }}>
        {formatFreq(band.frequency)}
        <span className="ml-1 text-[10px] text-muted-foreground">Hz</span>
      </span>

      <div className="relative z-10 h-36 flex items-center">
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

      <span
        className="relative z-10 value-chip tabular-nums"
        style={{ color: c, borderColor: `${c}55`, background: `${c}1f` }}
      >
        {band.gain > 0 ? '+' : ''}
        {band.gain.toFixed(1)} dB
      </span>

      <div className="relative z-10 flex w-full flex-col items-center gap-1 pt-1">
        <div className="flex w-full items-center justify-between">
          <span className="panel-label">Q</span>
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{band.Q.toFixed(1)}</span>
        </div>
        <Slider
          min={0.1}
          max={10}
          step={0.1}
          value={[band.Q]}
          onValueChange={([v]) => onChange(index, { ...band, Q: v })}
          className="w-full"
        />
      </div>
    </div>
  );
};

export default BandControl;
