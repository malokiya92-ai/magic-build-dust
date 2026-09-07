import { PRESETS } from '@/lib/audioEngine';

interface Props {
  activePreset: number;
  onSelect: (index: number) => void;
}

const PresetSelector = ({ activePreset, onSelect }: Props) => {
  return (
    <div className="grid grid-cols-2 gap-2">
      {PRESETS.map((preset, i) => {
        const active = activePreset === i;
        return (
          <button
            key={preset.name}
            onClick={() => onSelect(i)}
            className={`relative overflow-hidden rounded-lg px-3 py-2.5 text-left font-mono text-[11px] tracking-wide transition-all duration-200 border ${
              active
                ? 'border-primary/70 text-primary shadow-[0_0_22px_-6px_hsl(var(--primary)/0.8)]'
                : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:-translate-y-px'
            }`}
            style={active ? { background: 'linear-gradient(140deg, hsl(var(--primary)/0.22), hsl(var(--accent)/0.10))' } : { background: 'hsl(var(--surface-elevated)/0.7)' }}
          >
            {active && <span className="absolute left-0 top-0 h-full w-[2px] bg-primary" />}
            {preset.name}
          </button>
        );
      })}
    </div>
  );
};

export default PresetSelector;
