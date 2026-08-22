import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface VoiceWaveformVisualizerProps {
  isListening: boolean;
  isThinking?: boolean;
  isSpeakingAI?: boolean;
  energyLevel?: number;
  className?: string;
}

export const VoiceWaveformVisualizer: React.FC<VoiceWaveformVisualizerProps> = ({
  isListening,
  isThinking = false,
  isSpeakingAI = false,
  energyLevel = 0.5,
  className
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      phaseRef.current += isThinking ? 0.08 : isSpeakingAI ? 0.06 : isListening ? 0.05 : 0.02;

      const baseAmp = isListening
        ? 14 * Math.max(0.6, energyLevel * 1.5)
        : isSpeakingAI
        ? 12
        : isThinking
        ? 8
        : 3;

      // Primary gradient wave (Apple Siri-style harmonic glow)
      const grad1 = ctx.createLinearGradient(0, 0, width, 0);
      if (isListening) {
        grad1.addColorStop(0, 'rgba(16, 185, 129, 0.1)');
        grad1.addColorStop(0.5, 'rgba(52, 211, 153, 0.95)');
        grad1.addColorStop(1, 'rgba(16, 185, 129, 0.1)');
      } else if (isThinking) {
        grad1.addColorStop(0, 'rgba(245, 158, 11, 0.1)');
        grad1.addColorStop(0.5, 'rgba(251, 191, 36, 0.95)');
        grad1.addColorStop(1, 'rgba(245, 158, 11, 0.1)');
      } else if (isSpeakingAI) {
        grad1.addColorStop(0, 'rgba(56, 189, 248, 0.1)');
        grad1.addColorStop(0.5, 'rgba(14, 165, 233, 0.95)');
        grad1.addColorStop(1, 'rgba(56, 189, 248, 0.1)');
      } else {
        grad1.addColorStop(0, 'rgba(148, 163, 184, 0.1)');
        grad1.addColorStop(0.5, 'rgba(148, 163, 184, 0.4)');
        grad1.addColorStop(1, 'rgba(148, 163, 184, 0.1)');
      }

      // Draw Wave 1
      ctx.lineWidth = isListening || isSpeakingAI ? 2.5 : 1.5;
      ctx.strokeStyle = grad1;
      ctx.beginPath();
      for (let x = 0; x < width; x++) {
        const normX = (x / width) * Math.PI * 2;
        const envelope = Math.sin((x / width) * Math.PI); // Window tapering on edges
        const y = height / 2 + Math.sin(normX * 2 + phaseRef.current) * baseAmp * envelope;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Secondary subtle harmonic wave if active
      if (isListening || isSpeakingAI || isThinking) {
        const grad2 = ctx.createLinearGradient(0, 0, width, 0);
        if (isListening) {
          grad2.addColorStop(0, 'rgba(14, 165, 233, 0.05)');
          grad2.addColorStop(0.5, 'rgba(56, 189, 248, 0.6)');
          grad2.addColorStop(1, 'rgba(14, 165, 233, 0.05)');
        } else if (isThinking) {
          grad2.addColorStop(0, 'rgba(239, 68, 68, 0.05)');
          grad2.addColorStop(0.5, 'rgba(249, 115, 22, 0.6)');
          grad2.addColorStop(1, 'rgba(239, 68, 68, 0.05)');
        } else {
          grad2.addColorStop(0, 'rgba(139, 92, 246, 0.05)');
          grad2.addColorStop(0.5, 'rgba(168, 85, 247, 0.6)');
          grad2.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
        }

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = grad2;
        ctx.beginPath();
        for (let x = 0; x < width; x++) {
          const normX = (x / width) * Math.PI * 2;
          const envelope = Math.sin((x / width) * Math.PI);
          const y = height / 2 + Math.sin(normX * 3 - phaseRef.current * 1.2) * (baseAmp * 0.6) * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isListening, isThinking, isSpeakingAI, energyLevel]);

  return (
    <div className={cn("w-full max-w-xs h-10 flex items-center justify-center px-3 py-1 rounded-full bg-card/60 dark:bg-card/40 backdrop-blur-xl border border-border/40 shadow-inner", className)}>
      <canvas ref={canvasRef} width={280} height={40} className="w-full h-full" />
    </div>
  );
};

