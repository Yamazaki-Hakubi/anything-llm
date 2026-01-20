/**
 * Regime Compass Component
 * Visual indicator of current market regime
 */

import React, { useRef, useEffect, useCallback } from 'react';
import type { Regime } from '../../core/types';

interface RegimeCompassProps {
  regime: Regime | null;
  confidence: number;
}

const REGIME_POSITIONS: Record<string, { angle: number; color: string; label: string }> = {
  trending_bullish: { angle: -60, color: '#44ff88', label: 'BULL' },
  trending_bearish: { angle: 120, color: '#ff4444', label: 'BEAR' },
  range_bound: { angle: 90, color: '#4488ff', label: 'RANGE' },
  breakout: { angle: -30, color: '#88ff44', label: 'BREAK↑' },
  breakdown: { angle: 150, color: '#ff8844', label: 'BREAK↓' },
  consolidation: { angle: 0, color: '#888888', label: 'CONSOL' },
  high_volatility: { angle: 180, color: '#ff44ff', label: 'HI VOL' },
  low_volatility: { angle: 0, color: '#44ffff', label: 'LO VOL' },
  gamma_squeeze: { angle: -90, color: '#ffff44', label: 'γ SQZ' },
  mean_reversion: { angle: 60, color: '#8844ff', label: 'REVERT' },
};

export const RegimeCompass: React.FC<RegimeCompassProps> = ({ regime, confidence }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const currentAngle = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 15;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Get target angle and color
    const regimeInfo = regime ? REGIME_POSITIONS[regime.type] : null;
    const targetAngle = regimeInfo ? (regimeInfo.angle * Math.PI) / 180 : 0;
    const color = regimeInfo?.color ?? '#c9a227';

    // Animate needle
    const angleDiff = targetAngle - currentAngle.current;
    currentAngle.current += angleDiff * 0.1;

    // Draw outer ring
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Draw regime zones
    Object.entries(REGIME_POSITIONS).forEach(([key, info]) => {
      const angleRad = (info.angle * Math.PI) / 180;
      const isActive = regime?.type === key;

      ctx.fillStyle = isActive ? info.color : `${info.color}33`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius - 5, angleRad - 0.15, angleRad + 0.15);
      ctx.closePath();
      ctx.fill();

      // Label
      const labelX = centerX + Math.cos(angleRad) * (radius + 12);
      const labelY = centerY + Math.sin(angleRad) * (radius + 12);
      ctx.fillStyle = isActive ? info.color : '#444466';
      ctx.font = '8px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(info.label, labelX, labelY);
    });

    // Draw inner circle
    const innerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius * 0.6
    );
    innerGradient.addColorStop(0, '#1a1a3a');
    innerGradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Draw confidence ring
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(
      centerX,
      centerY,
      radius * 0.7,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * confidence
    );
    ctx.stroke();

    // Draw needle
    const needleLength = radius * 0.5;
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle.current);

    // Needle shadow/glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(needleLength, 0);
    ctx.stroke();

    // Needle tip
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(needleLength, 0);
    ctx.lineTo(needleLength - 8, -4);
    ctx.lineTo(needleLength - 8, 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;

    // Center dot
    ctx.fillStyle = '#c9a227';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Regime label
    if (regime) {
      ctx.fillStyle = color;
      ctx.font = 'bold 10px Orbitron, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(regimeInfo?.label ?? regime.type.toUpperCase(), centerX, centerY + radius * 0.85);
    }

    animationRef.current = requestAnimationFrame(draw);
  }, [regime, confidence]);

  useEffect(() => {
    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  return (
    <div className="relative w-full h-40 bg-cosmic-void rounded-lg border border-gauge-frame/30 overflow-hidden">
      <div className="absolute top-2 left-2 text-cosmic-gold text-xs font-cosmic z-10">
        Regime Compass
      </div>
      <canvas ref={canvasRef} width={180} height={160} className="w-full h-full" />
      <div className="absolute bottom-2 right-2 text-cosmic-gold/40 text-xs">
        {(confidence * 100).toFixed(0)}% conf
      </div>
    </div>
  );
};

export default RegimeCompass;
