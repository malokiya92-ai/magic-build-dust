import { Slider } from '@/components/ui/slider';
import { Gauge, RotateCcw } from 'lucide-react';

interface Props {
  gainDb: number;
  onChange: (db: number) => void;
}

const MasterOutputPanel = ({ gainDb, onChange }: Props) => {
  const pct = Math.min(100, Math.max(0, ((gainDb + 24) / 36) * 100));

  return (
    <div className="p-4 rounded-lg surface-elevated border border-border/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="panel-label flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-primary" />
          Master Output
        </h3>
        <button
          onClick={() => onChange(0)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          aria-label="Reset master gain to unity"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs text-muted-foreground">Trim</span>
        <span className="font-mono text-lg text-primary text-glow">
          {gainDb > 0 ? '+' : ''}{gainDb.toFixed(1)} <span className="text-xs text-muted-foreground">dB</span>
        </span>
      </div>

      <Slider
        min={-24}
        max={12}
        step={0.5}
        value={[gainDb]}
        onValueChange={([v]) => onChange(v)}
      />

      <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-150"
          style={{ width: `${pct}%`, background: 'var(--gradient-primary)' }}
        />
      </div>

      <div className="flex justify-between mt-1.5 font-mono text-[10px] text-muted-foreground">
        <span>-24</span>
        <span>UNITY</span>
        <span>+12</span>
      </div>
    </div>
  );
};

export default MasterOutputPanel;
