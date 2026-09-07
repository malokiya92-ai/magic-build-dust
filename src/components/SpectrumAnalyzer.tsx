import { useRef, useEffect, useCallback } from 'react';
import { AudioEngine } from '@/lib/audioEngine';

interface Props {
  engine: AudioEngine | null;
  isActive: boolean;
}

function setup(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: rect.width, h: rect.height };
}

function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.strokeStyle = 'hsla(240, 25%, 45%, 0.16)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const y = (h / 5) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (let i = 1; i < 8; i++) {
    const x = (w / 8) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
}

const SpectrumAnalyzer = ({ engine, isActive }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const drawIdle = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { ctx, w, h } = setup(canvas);
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);
    ctx.strokeStyle = 'hsla(243, 60%, 70%, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, h - 6);
    ctx.lineTo(w, h - 6);
    ctx.stroke();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;
    const { ctx, w, h } = setup(canvas);

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);

    const data = engine.getFrequencyData();
    if (data.length === 0) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const barCount = 64;
    const gap = 2;
    const barWidth = w / barCount - gap;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * data.length * 0.6);
      const value = data[dataIndex] / 255;
      const barH = Math.max(1, value * h * 0.85);

      const hue = 232 + (i / barCount) * 55;
      const gradient = ctx.createLinearGradient(0, h, 0, h - barH);
      gradient.addColorStop(0, `hsla(${hue}, 85%, 55%, 0.9)`);
      gradient.addColorStop(0.55, `hsla(${hue}, 85%, 62%, 0.45)`);
      gradient.addColorStop(1, `hsla(${hue}, 90%, 72%, 0.12)`);

      ctx.fillStyle = gradient;
      const x = i * (barWidth + gap);
      ctx.fillRect(x, h - barH, barWidth, barH);

      ctx.fillStyle = `hsla(${hue}, 95%, 72%, 0.95)`;
      ctx.shadowColor = `hsla(${hue}, 95%, 70%, 0.9)`;
      ctx.shadowBlur = 8;
      ctx.fillRect(x, h - barH - 2, barWidth, 2);
      ctx.shadowBlur = 0;
    }

    animRef.current = requestAnimationFrame(draw);
  }, [engine]);

  useEffect(() => {
    if (isActive) {
      animRef.current = requestAnimationFrame(draw);
    } else {
      drawIdle();
      window.addEventListener('resize', drawIdle);
    }
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', drawIdle);
    };
  }, [isActive, draw, drawIdle]);

  return (
    <div className="relative h-full w-full">
      <canvas ref={canvasRef} className="w-full h-full rounded-lg" style={{ minHeight: '120px' }} />
      {!isActive && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="panel-label">Load a file or enable the mic</span>
        </div>
      )}
    </div>
  );
};

export default SpectrumAnalyzer;
