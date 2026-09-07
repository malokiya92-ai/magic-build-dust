import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from '@/lib/audioEngine';

interface Props {
  engine: AudioEngine | null;
  isActive: boolean;
}

const MIN_DB = -60;
const MAX_DB = 6;

const dbToPct = (db: number) => {
  const clamped = Math.max(MIN_DB, Math.min(MAX_DB, db));
  return ((clamped - MIN_DB) / (MAX_DB - MIN_DB)) * 100;
};

const Meter = ({ label, db, peak, color }: { label: string; db: number; peak: number; color: string }) => {
  const pct = dbToPct(db);
  const peakPct = dbToPct(peak);
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="panel-label">{label}</span>
        <span className="font-mono text-sm tabular-nums" style={{ color, textShadow: `0 0 12px ${color}66` }}>
          {db <= -60 ? '−∞' : `${db.toFixed(1)}`} <span className="text-[10px] text-muted-foreground">dB</span>
        </span>
      </div>
      <div className="relative h-4 rounded-md bg-background/70 overflow-hidden border border-border/50 shadow-[inset_0_1px_3px_hsl(240_80%_3%/0.8)]">
        {/* tick marks */}
        {[20, 40, 60, 80].map((t) => (
          <div key={t} className="absolute top-0 bottom-0 w-px bg-foreground/5" style={{ left: `${t}%` }} />
        ))}
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-75"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color} 0%, ${color} 62%, hsl(35,90%,58%) 84%, hsl(0,85%,58%) 100%)`,
            boxShadow: `0 0 14px -2px ${color}`,
            opacity: 0.95,
          }}
        />
        <div className="absolute top-0 bottom-0 w-0.5 bg-foreground/90" style={{ left: `${peakPct}%` }} />
        <div className="absolute top-0 bottom-0 w-px bg-foreground/25" style={{ left: `${dbToPct(0)}%` }} />
      </div>
    </div>
  );
};

const LevelMeters = ({ engine, isActive }: Props) => {
  const [inDb, setInDb] = useState(-80);
  const [outDb, setOutDb] = useState(-80);
  const peakIn = useRef(-80);
  const peakOut = useRef(-80);
  const [peakInState, setPeakInState] = useState(-80);
  const [peakOutState, setPeakOutState] = useState(-80);
  const rafRef = useRef(0);
  const peakDecay = useRef(0);

  useEffect(() => {
    const tick = () => {
      if (engine) {
        const i = engine.getInputRMSdB();
        const o = engine.getOutputRMSdB();
        setInDb(i);
        setOutDb(o);
        if (i > peakIn.current) peakIn.current = i;
        if (o > peakOut.current) peakOut.current = o;
        peakDecay.current++;
        if (peakDecay.current > 30) {
          peakDecay.current = 0;
          peakIn.current = Math.max(i, peakIn.current - 1);
          peakOut.current = Math.max(o, peakOut.current - 1);
          setPeakInState(peakIn.current);
          setPeakOutState(peakOut.current);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (isActive) rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [engine, isActive]);

  const diff = outDb - inDb;

  return (
    <div className="p-4 rounded-lg bg-background/40 border border-border/50 space-y-3">
      <div className="flex items-center justify-between">
        <span className="section-title panel-label">RMS Level Meters</span>
        <span className="font-mono text-xs tabular-nums">
          <span className="text-muted-foreground">Δ </span>
          <span className={diff > 0.1 ? 'text-band-3' : diff < -0.1 ? 'text-band-1' : 'text-muted-foreground'}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)} dB
          </span>
        </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <Meter label="Input · dry" db={inDb} peak={peakInState} color="hsl(220, 15%, 70%)" />
        <Meter label="Output · wet" db={outDb} peak={peakOutState} color="hsl(243, 85%, 70%)" />
      </div>
    </div>
  );
};

export default LevelMeters;
