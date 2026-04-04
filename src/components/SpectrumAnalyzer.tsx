import { useRef, useEffect, useCallback } from 'react';
import { AudioEngine } from '@/lib/audioEngine';

interface Props {
  engine: AudioEngine | null;
  isActive: boolean;
}

const SpectrumAnalyzer = ({ engine, isActive }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.clearRect(0, 0, w, h);

    const data = engine.getFrequencyData();
    if (data.length === 0) {
      animRef.current = requestAnimationFrame(draw);
      return;
    }

    const barCount = 64;
    const barWidth = w / barCount - 2;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = Math.floor((i / barCount) * data.length * 0.6);
      const value = data[dataIndex] / 255;
      const barH = value * h * 0.85;

      const hue = 175 + (i / barCount) * 30;
      const gradient = ctx.createLinearGradient(0, h, 0, h - barH);
      gradient.addColorStop(0, `hsla(${hue}, 80%, 50%, 0.8)`);
      gradient.addColorStop(0.5, `hsla(${hue}, 80%, 50%, 0.4)`);
      gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 0.1)`);

      ctx.fillStyle = gradient;
      const x = i * (barWidth + 2);
      ctx.fillRect(x, h - barH, barWidth, barH);

      // Glow cap
      ctx.fillStyle = `hsla(${hue}, 90%, 65%, 0.9)`;
      ctx.fillRect(x, h - barH - 2, barWidth, 2);
    }

    animRef.current = requestAnimationFrame(draw);
  }, [engine]);

  useEffect(() => {
    if (isActive) {
      animRef.current = requestAnimationFrame(draw);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [isActive, draw]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full rounded-lg"
      style={{ minHeight: '120px' }}
    />
  );
};

export default SpectrumAnalyzer;
