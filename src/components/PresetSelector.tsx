import { PRESETS } from '@/lib/audioEngine';

interface Props {
  activePreset: number;
  onSelect: (index: number) => void;
}

const PresetSelector = ({ activePreset, onSelect }: Props) => {
  return (
    <div className="flex flex-wrap gap-2">
      {PRESETS.map((preset, i) => (
        <button
          key={preset.name}
          onClick={() => onSelect(i)}
          className={`px-4 py-2 rounded-lg font-mono text-xs tracking-wide transition-all border ${
            activePreset === i
              ? 'bg-primary/15 border-primary text-primary glow-primary'
              : 'surface-elevated border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
};

export default PresetSelector;
