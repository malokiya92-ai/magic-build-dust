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
      <div className="flex items-baseline justify-between mb-1">
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono text-xs tabular-nums" style={{ color }}>
          {db <= -60 ? '−∞' : `${db.toFixed(1)}`} dB
        </span>
      </div>
      <div className="relative h-3 rounded-sm bg-muted/40 overflow-hidden border border-border/40">
        {/* fill */}
        <div
          className="absolute inset-y-0 left-0 transition-[width] duration-75"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color} 0%, ${color} 70%, hsl(0,80%,55%) 100%)`, opacity: 0.85 }}
        />
        {/* peak hold */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-foreground"
          style={{ left: `${peakPct}%` }}
        />
        {/* 0 dB tick */}
        <div className="absolute top-0 bottom-0 w-px bg-foreground/30" style={{ left: `${dbToPct(0)}%` }} />
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
        // decay every ~500ms
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
    <div className="p-3 rounded-lg bg-muted/20 border border-border/40 space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground">RMS LEVEL METERS</span>
        <span className="font-mono text-[11px] tabular-nums">
          <span className="text-muted-foreground">Δ </span>
          <span className={diff > 0.1 ? 'text-band-2' : diff < -0.1 ? 'text-band-5' : 'text-muted-foreground'}>
            {diff > 0 ? '+' : ''}{diff.toFixed(1)} dB
          </span>
        </span>
      </div>
      <div className="flex gap-4">
        <Meter label="INPUT" db={inDb} peak={peakInState} color="hsl(220, 15%, 70%)" />
        <Meter label="OUTPUT" db={outDb} peak={peakOutState} color="hsl(243, 80%, 68%)" />
      </div>
    </div>
  );
};

export default LevelMeters;
