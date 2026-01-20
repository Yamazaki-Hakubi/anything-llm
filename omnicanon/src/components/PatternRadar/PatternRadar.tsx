/**
 * Pattern Radar Component
 * Displays strategies and signals in a radar-style visualization
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { ActiveStrategy, Signal } from '../../core/types';

interface PatternRadarProps {
  strategies: ActiveStrategy[];
  signals: Signal[];
  onBlipClick?: (strategy: ActiveStrategy) => void;
}

interface Blip {
  x: number;
  y: number;
  size: number;
  color: string;
  strategy: ActiveStrategy;
  signal: Signal | null;
}

const STRATEGY_ANGLES: Record<string, number> = {
  gamma_scalp: 0,
  momentum_follow: 36,
  mean_reversion: 72,
  volatility_expansion: 108,
  volatility_contraction: 144,
  liquidity_hunt: 180,
  flow_alignment: 216,
  structural_break: 252,
  pattern_recognition: 288,
  fractal_resonance: 324,
};

const TIMEFRAME_RADII: Record<number, number> = {
  5: 0.3,
  15: 0.5,
  30: 0.6,
  60: 0.75,
  240: 0.9,
};

export const PatternRadar: React.FC<PatternRadarProps> = ({
  strategies,
  signals,
  onBlipClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blips, setBlips] = useState<Blip[]>([]);
  const [hoveredBlip, setHoveredBlip] = useState<Blip | null>(null);
  const sweepAngle = useRef(0);
  const animationRef = useRef<number>(0);

  // Calculate blip positions
  useEffect(() => {
    const newBlips: Blip[] = strategies.map((strategy) => {
      const angle = STRATEGY_ANGLES[strategy.template.type] ?? Math.random() * 360;
      const angleRad = (angle * Math.PI) / 180;

      // Radius based on timeframe
      const radiusRatio = TIMEFRAME_RADII[strategy.template.timeframe] ?? 0.5;

      // Find associated signal
      const signal = signals.find((s) => s.strategyId === strategy.template.id) ?? null;

      // Size based on confidence
      const size = 8 + strategy.activationScore * 12;

      // Color based on performance
      let color: string;
      if (strategy.performance.winRate > 0.55) {
        color = '#44ff88';
      } else if (strategy.performance.winRate > 0.45) {
        color = '#ffaa44';
      } else {
        color = '#ff4444';
      }

      return {
        x: Math.cos(angleRad) * radiusRatio,
        y: Math.sin(angleRad) * radiusRatio,
        size,
        color,
        strategy,
        signal,
      };
    });

    setBlips(newBlips);
  }, [strategies, signals]);

  // Draw radar
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 20;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Draw background gradient
    const bgGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      maxRadius
    );
    bgGradient.addColorStop(0, '#0a0a1a');
    bgGradient.addColorStop(1, '#1a1a3a');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, maxRadius, 0, Math.PI * 2);
    ctx.fill();

    // Draw concentric circles (timeframe rings)
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;

    [0.3, 0.5, 0.6, 0.75, 0.9].forEach((ratio, i) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, maxRadius * ratio, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      const labels = ['5m', '15m', '30m', '1h', '4h'];
      ctx.fillStyle = '#444466';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText(labels[i], centerX + maxRadius * ratio + 5, centerY);
    });

    // Draw sector lines (strategy types)
    ctx.strokeStyle = '#2a2a4a';
    for (let angle = 0; angle < 360; angle += 36) {
      const rad = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(rad) * maxRadius,
        centerY + Math.sin(rad) * maxRadius
      );
      ctx.stroke();
    }

    // Draw sweep line
    sweepAngle.current = (sweepAngle.current + 2) % 360;
    const sweepRad = (sweepAngle.current * Math.PI) / 180;

    const sweepGradient = ctx.createLinearGradient(
      centerX,
      centerY,
      centerX + Math.cos(sweepRad) * maxRadius,
      centerY + Math.sin(sweepRad) * maxRadius
    );
    sweepGradient.addColorStop(0, 'rgba(201, 162, 39, 0)');
    sweepGradient.addColorStop(0.5, 'rgba(201, 162, 39, 0.3)');
    sweepGradient.addColorStop(1, 'rgba(201, 162, 39, 0.8)');

    ctx.strokeStyle = sweepGradient;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(sweepRad) * maxRadius,
      centerY + Math.sin(sweepRad) * maxRadius
    );
    ctx.stroke();

    // Draw sweep glow cone
    ctx.fillStyle = 'rgba(201, 162, 39, 0.05)';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(
      centerX,
      centerY,
      maxRadius,
      sweepRad - 0.5,
      sweepRad,
      false
    );
    ctx.closePath();
    ctx.fill();

    // Draw blips
    blips.forEach((blip) => {
      const x = centerX + blip.x * maxRadius;
      const y = centerY + blip.y * maxRadius;

      // Calculate brightness based on sweep proximity
      const blipAngle = Math.atan2(blip.y, blip.x);
      const angleDiff = Math.abs(sweepRad - blipAngle);
      const brightness = Math.max(0.3, 1 - angleDiff / Math.PI);

      // Draw blip glow
      if (blip.strategy.isActive) {
        ctx.shadowColor = blip.color;
        ctx.shadowBlur = 15 * brightness;
      }

      // Draw blip
      ctx.fillStyle = blip.color;
      ctx.globalAlpha = brightness;
      ctx.beginPath();
      ctx.arc(x, y, blip.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Draw signal line to center if signal exists
      if (blip.signal) {
        const signalGradient = ctx.createLinearGradient(centerX, centerY, x, y);
        signalGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        signalGradient.addColorStop(
          1,
          blip.signal.direction === 'long'
            ? 'rgba(68, 255, 136, 0.6)'
            : 'rgba(255, 68, 68, 0.6)'
        );

        ctx.strokeStyle = signalGradient;
        ctx.lineWidth = blip.signal.strength * 3;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      // Draw hover info
      if (hoveredBlip === blip) {
        ctx.fillStyle = '#c9a227';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(blip.strategy.template.name, x + blip.size + 5, y - 5);
        ctx.fillStyle = '#888888';
        ctx.fillText(
          `WR: ${(blip.strategy.performance.winRate * 100).toFixed(0)}%`,
          x + blip.size + 5,
          y + 8
        );
      }
    });

    // Draw center point
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fill();

    animationRef.current = requestAnimationFrame(draw);
  }, [blips, hoveredBlip]);

  // Start animation
  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  // Handle mouse events
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
      const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 20;

      // Check if mouse is over any blip
      const hovered = blips.find((blip) => {
        const blipX = centerX + blip.x * maxRadius;
        const blipY = centerY + blip.y * maxRadius;
        const distance = Math.sqrt((x - blipX) ** 2 + (y - blipY) ** 2);
        return distance < blip.size + 5;
      });

      setHoveredBlip(hovered ?? null);
    },
    [blips]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (hoveredBlip && onBlipClick) {
        onBlipClick(hoveredBlip.strategy);
      }
    },
    [hoveredBlip, onBlipClick]
  );

  return (
    <div className="relative w-full h-64 bg-cosmic-void rounded-lg border border-gauge-frame/30 overflow-hidden">
      <div className="absolute top-2 left-2 text-cosmic-gold text-sm font-cosmic z-10">
        Pattern Radar
      </div>

      <canvas
        ref={canvasRef}
        width={300}
        height={256}
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-cosmic-gold/60">
        <span>Active: {strategies.filter((s) => s.isActive).length}</span>
        <span>Signals: {signals.length}</span>
      </div>

      {/* Strategy type legend */}
      <div className="absolute top-2 right-2 text-xs space-y-0.5">
        {['gamma_scalp', 'momentum_follow', 'mean_reversion'].map((type, i) => (
          <div key={type} className="flex items-center gap-1 text-cosmic-gold/40">
            <div className="w-2 h-2 rounded-full bg-cosmic-gold/40" />
            <span>{type.replace('_', ' ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PatternRadar;
