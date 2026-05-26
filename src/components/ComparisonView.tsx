import { useRef, useEffect, useCallback } from 'react';
import { AudioEngine } from '@/lib/audioEngine';

interface Props {
  engine: AudioEngine | null;
  isActive: boolean;
}

/**
 * Side-by-side input vs output visualization.
 * Top: overlaid spectra (input = muted, output = accent) + filled difference.
 * Bottom: overlaid time-domain waveforms.
 */
const ComparisonView = ({ engine, isActive }: Props) => {
  const specRef = useRef<HTMLCanvasElement>(null);
  const waveRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const specCanvas = specRef.current;
    const waveCanvas = waveRef.current;
    if (!specCanvas || !waveCanvas || !engine) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const dpr = window.devicePixelRatio || 1;

    // --- Spectrum diff ---
    {
      const ctx = specCanvas.getContext('2d')!;
      const rect = specCanvas.getBoundingClientRect();
      specCanvas.width = rect.width * dpr;
      specCanvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const inData = engine.getInputFrequencyData();
      const outData = engine.getFrequencyData();

      // grid
      ctx.strokeStyle = 'hsla(220, 15%, 30%, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 5; i++) {
        const y = (h / 5) * i;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      if (inData.length === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const bins = Math.min(inData.length, outData.length);
      const usable = Math.floor(bins * 0.6);

      const xAt = (i: number) => {
        // log-ish scale across width
        const t = i / (usable - 1);
        return Math.pow(t, 0.6) * w;
      };
      const yAt = (v: number) => h - (v / 255) * h * 0.95;

      // Difference fill (output - input)
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < usable; i++) {
        const x = xAt(i);
        const diff = (outData[i] - inData[i]) / 255;
        const y = h / 2 - diff * h * 0.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h / 2);
      ctx.lineTo(0, h / 2);
      ctx.closePath();
      ctx.fillStyle = 'hsla(30, 85%, 55%, 0.18)';
      ctx.fill();

      // Input spectrum (dry) — muted line
      ctx.beginPath();
      for (let i = 0; i < usable; i++) {
        const x = xAt(i);
        const y = yAt(inData[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'hsla(220, 15%, 65%, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Output spectrum (wet) — accent line
      ctx.beginPath();
      for (let i = 0; i < usable; i++) {
        const x = xAt(i);
        const y = yAt(outData[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'hsl(175, 80%, 55%)';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'hsla(175, 80%, 55%, 0.5)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // --- Waveform overlay ---
    {
      const ctx = waveCanvas.getContext('2d')!;
      const rect = waveCanvas.getBoundingClientRect();
      waveCanvas.width = rect.width * dpr;
      waveCanvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const inData = engine.getInputTimeDomainData();
      const outData = engine.getTimeDomainData();

      // zero line
      ctx.strokeStyle = 'hsla(220, 15%, 35%, 0.5)';
      ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke();

      const drawWave = (data: Uint8Array, color: string, lw: number, glow = 0) => {
        if (data.length === 0) return;
        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = (i / data.length) * w;
          const y = ((data[i] - 128) / 128) * (h / 2) * 0.9 + h / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = lw;
        if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
        ctx.stroke();
        ctx.shadowBlur = 0;
      };

      drawWave(inData, 'hsla(220, 15%, 65%, 0.7)', 1.2);
      drawWave(outData, 'hsl(30, 85%, 60%)', 1.5, 4);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [engine]);

  useEffect(() => {
    if (isActive) animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive, draw]);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-[10px] font-mono tracking-wider">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-muted-foreground/70" />
          <span className="text-muted-foreground">INPUT (DRY)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-0.5" style={{ background: 'hsl(175, 80%, 55%)' }} />
          <span className="text-muted-foreground">OUTPUT (WET)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded-sm" style={{ background: 'hsla(30, 85%, 55%, 0.4)' }} />
          <span className="text-muted-foreground">Δ DIFF</span>
        </div>
      </div>
      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1">SPECTRUM • IN vs OUT</div>
        <canvas ref={specRef} className="w-full rounded-lg" style={{ height: 160 }} />
      </div>
      <div>
        <div className="text-[10px] font-mono text-muted-foreground tracking-wider mb-1">WAVEFORM • IN vs OUT</div>
        <canvas ref={waveRef} className="w-full rounded-lg" style={{ height: 100 }} />
      </div>
    </div>
  );
};

export default ComparisonView;
