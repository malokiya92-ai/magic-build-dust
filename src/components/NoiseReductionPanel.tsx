import { NoiseReduction } from '@/lib/audioEngine';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Waves } from 'lucide-react';

interface Props {
  settings: NoiseReduction;
  onChange: (settings: NoiseReduction) => void;
}

const Row = ({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="value-chip tabular-nums">{value}</span>
    </div>
    {children}
  </div>
);

const NoiseReductionPanel = ({ settings, onChange }: Props) => {
  return (
    <div className={`p-4 panel panel-hover transition-opacity ${!settings.enabled ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-title panel-label">
          <Waves className="w-3.5 h-3.5 text-primary" />
          Noise Reduction
        </h3>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(enabled) => onChange({ ...settings, enabled })}
        />
      </div>

      <div className="space-y-4">
        <Row label="Gate Threshold" value={`${settings.gateThreshold} dB`}>
          <Slider
            min={-60}
            max={0}
            step={1}
            value={[settings.gateThreshold]}
            onValueChange={([v]) => onChange({ ...settings, gateThreshold: v })}
          />
        </Row>

        <Row label="High-Pass" value={`${settings.highPassFreq} Hz`}>
          <Slider
            min={20}
            max={500}
            step={5}
            value={[settings.highPassFreq]}
            onValueChange={([v]) => onChange({ ...settings, highPassFreq: v })}
          />
        </Row>

        <Row label="Low-Pass" value={`${Math.round(settings.lowPassFreq / 1000)}k Hz`}>
          <Slider
            min={2000}
            max={20000}
            step={500}
            value={[settings.lowPassFreq]}
            onValueChange={([v]) => onChange({ ...settings, lowPassFreq: v })}
          />
        </Row>
      </div>
    </div>
  );
};

export default NoiseReductionPanel;
