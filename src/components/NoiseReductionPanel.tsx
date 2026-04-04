import { NoiseReduction } from '@/lib/audioEngine';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface Props {
  settings: NoiseReduction;
  onChange: (settings: NoiseReduction) => void;
}

const NoiseReductionPanel = ({ settings, onChange }: Props) => {
  return (
    <div className={`p-4 rounded-xl surface-elevated border border-border/50 transition-opacity ${!settings.enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-sm text-foreground tracking-wide">NOISE REDUCTION</h3>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
        />
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-muted-foreground">Gate Threshold</span>
            <span className="font-mono text-xs text-primary">{settings.gateThreshold} dB</span>
          </div>
          <Slider
            min={-60}
            max={0}
            step={1}
            value={[settings.gateThreshold]}
            onValueChange={([v]) => onChange({ ...settings, gateThreshold: v })}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-muted-foreground">High-Pass</span>
            <span className="font-mono text-xs text-accent">{settings.highPassFreq} Hz</span>
          </div>
          <Slider
            min={20}
            max={500}
            step={5}
            value={[settings.highPassFreq]}
            onValueChange={([v]) => onChange({ ...settings, highPassFreq: v })}
          />
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-muted-foreground">Low-Pass</span>
            <span className="font-mono text-xs text-accent">{Math.round(settings.lowPassFreq / 1000)}k Hz</span>
          </div>
          <Slider
            min={2000}
            max={20000}
            step={500}
            value={[settings.lowPassFreq]}
            onValueChange={([v]) => onChange({ ...settings, lowPassFreq: v })}
          />
        </div>
      </div>
    </div>
  );
};

export default NoiseReductionPanel;
