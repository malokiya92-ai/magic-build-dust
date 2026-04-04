import { useRef, useEffect, useCallback } from 'react';
import { AudioEngine, EQBand } from '@/lib/audioEngine';

interface Props {
  engine: AudioEngine | null;
  bands: EQBand[];
}

const BAND_COLORS = [
  'hsl(0, 75%, 60%)',
  'hsl(30, 85%, 55%)',
  'hsl(55, 80%, 50%)',
  'hsl(175, 80%, 50%)',
  'hsl(260, 70%, 65%)',
];

const EQCurveDisplay = ({ engine, bands }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const midY = h / 2;

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'hsla(220, 15%, 30%, 0.3)';
    ctx.lineWidth = 1;
    const freqs = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    freqs.forEach(f => {
      const x = freqToX(f, w);
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    });

    const gains = [-12, -6, 0, 6, 12];
    gains.forEach(g => {
      const y = gainToY(g, h);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    });

    // Zero line
    ctx.strokeStyle = 'hsla(220, 15%, 40%, 0.5)';
    ctx.beginPath();
    ctx.moveTo(0, midY);
    ctx.lineTo(w, midY);
    ctx.stroke();

    // Labels
    ctx.fillStyle = 'hsla(210, 20%, 50%, 0.7)';
    ctx.font = '10px "JetBrains Mono", monospace';
    freqs.forEach(f => {
      const x = freqToX(f, w);
      const label = f >= 1000 ? `${f / 1000}k` : `${f}`;
      ctx.fillText(label, x - 8, h - 4);
    });
    gains.forEach(g => {
      if (g === 0) return;
      const y = gainToY(g, h);
      ctx.fillText(`${g > 0 ? '+' : ''}${g}`, 4, y - 3);
    });

    // Compute combined response
    if (engine) {
      const resp = engine.getFrequencyResponse();
      
      // Combined curve
      ctx.beginPath();
      ctx.strokeStyle = 'hsl(175, 80%, 50%)';
      ctx.lineWidth = 2;
      
      for (let i = 0; i < resp.frequencies.length; i++) {
        const x = freqToX(resp.frequencies[i], w);
        const y = gainToY(resp.magnitudes[i], h);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Fill under curve
      const lastX = freqToX(resp.frequencies[resp.frequencies.length - 1], w);
      ctx.lineTo(lastX, midY);
      ctx.lineTo(freqToX(resp.frequencies[0], w), midY);
      ctx.closePath();
      ctx.fillStyle = 'hsla(175, 80%, 50%, 0.08)';
      ctx.fill();
    }

    // Band dots
    bands.forEach((band, i) => {
      if (!band.enabled) return;
      const x = freqToX(band.frequency, w);
      const y = gainToY(band.gain, h);
      
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = BAND_COLORS[i];
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.strokeStyle = BAND_COLORS[i];
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.4;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }, [engine, bands]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '200px' }}
    />
  );
};

function freqToX(freq: number, width: number): number {
  const minLog = Math.log10(20);
  const maxLog = Math.log10(20000);
  return ((Math.log10(freq) - minLog) / (maxLog - minLog)) * width;
}

function gainToY(gain: number, height: number): number {
  const maxGain = 15;
  return height / 2 - (gain / maxGain) * (height / 2);
}

export default EQCurveDisplay;
