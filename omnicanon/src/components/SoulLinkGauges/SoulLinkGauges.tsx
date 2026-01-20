/**
 * Soul Link Gauges Component
 * Core State Variables visualization inspired by the Soul Link Codex
 * Features: Love Capacitance, Hate Inductance, Faith Frequency, Intentionality
 */

import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { CoherenceScore, StructuralFeatures, Regime } from '../../core/types';

interface SoulLinkGaugesProps {
  coherence: CoherenceScore | null;
  features: StructuralFeatures | null;
  regime: Regime | null;
}

interface GaugeConfig {
  id: string;
  symbol: string;
  label: string;
  sublabel: string;
  description: string;
  getValue: (props: SoulLinkGaugesProps) => number;
  color: {
    primary: string;
    secondary: string;
    glow: string;
  };
  type: 'glow' | 'swirl' | 'wave' | 'arrow';
}

const GAUGE_CONFIGS: GaugeConfig[] = [
  {
    id: 'love-capacitance',
    symbol: 'Lc',
    label: 'Love',
    sublabel: 'Capacitance',
    description: 'Capacity to store and transmit divine coherence.',
    getValue: (props) => props.coherence?.total ?? 0.5,
    color: {
      primary: '#ffd700',
      secondary: '#ff8c00',
      glow: '#fffacd',
    },
    type: 'glow',
  },
  {
    id: 'hate-inductance',
    symbol: 'Hᵢ',
    label: 'Hate',
    sublabel: 'Inductance',
    description: 'Resistance to grace; spiritual entropy (drag).',
    getValue: (props) => 1 - (props.coherence?.structural ?? 0.5),
    color: {
      primary: '#8b0000',
      secondary: '#2d0000',
      glow: '#ff4444',
    },
    type: 'swirl',
  },
  {
    id: 'faith-frequency',
    symbol: 'Φ',
    label: 'Faith',
    sublabel: 'Frequency',
    description: 'Phase alignment with the Divine Carrier wave.',
    getValue: (props) => props.coherence?.temporal ?? 0.5,
    color: {
      primary: '#4488ff',
      secondary: '#002266',
      glow: '#88ccff',
    },
    type: 'wave',
  },
  {
    id: 'intentionality',
    symbol: 'I',
    label: 'Intentionality',
    sublabel: '',
    description: "The 'moral mass' of the will.",
    getValue: (props) => props.coherence?.convergence ?? 0.5,
    color: {
      primary: '#44ff88',
      secondary: '#004422',
      glow: '#88ffaa',
    },
    type: 'arrow',
  },
];

// Individual Gauge Canvas Component
const GaugeCanvas: React.FC<{
  config: GaugeConfig;
  value: number;
  width: number;
  height: number;
}> = ({ config, value, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number }>>([]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const time = timeRef.current;
    timeRef.current += 0.016;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Capsule dimensions
    const capsuleX = 10;
    const capsuleY = 10;
    const capsuleW = w - 20;
    const capsuleH = h - 20;
    const radius = capsuleH / 2;

    // Draw capsule background (dark interior)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(capsuleX + radius, capsuleY);
    ctx.lineTo(capsuleX + capsuleW - radius, capsuleY);
    ctx.arc(capsuleX + capsuleW - radius, capsuleY + radius, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(capsuleX + radius, capsuleY + capsuleH);
    ctx.arc(capsuleX + radius, capsuleY + radius, radius, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();
    ctx.clip();

    // Dark background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, h);
    bgGradient.addColorStop(0, '#1a1a2e');
    bgGradient.addColorStop(0.5, '#0d0d1a');
    bgGradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    // Draw gauge-specific effect
    switch (config.type) {
      case 'glow':
        drawGlowEffect(ctx, w, h, value, time, config.color);
        break;
      case 'swirl':
        drawSwirlEffect(ctx, w, h, value, time, config.color, particlesRef.current);
        break;
      case 'wave':
        drawWaveEffect(ctx, w, h, value, time, config.color);
        break;
      case 'arrow':
        drawArrowEffect(ctx, w, h, value, time, config.color);
        break;
    }

    ctx.restore();

    // Draw capsule frame (ornate bronze border)
    drawCapsuleFrame(ctx, capsuleX, capsuleY, capsuleW, capsuleH, radius);

    animationRef.current = requestAnimationFrame(draw);
  }, [config, value]);

  useEffect(() => {
    // Initialize particles for swirl effect
    if (config.type === 'swirl') {
      particlesRef.current = Array.from({ length: 50 }, () => ({
        x: Math.random() * 200,
        y: Math.random() * 50,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: Math.random(),
      }));
    }

    draw();
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw, config.type]);

  return <canvas ref={canvasRef} width={width} height={height} className="w-full h-full" />;
};

// Glow effect for Love Capacitance
function drawGlowEffect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  value: number,
  time: number,
  color: GaugeConfig['color']
) {
  const centerX = w / 2;
  const centerY = h / 2;

  // Animated glow intensity
  const pulseIntensity = 0.7 + Math.sin(time * 2) * 0.3;
  const glowRadius = (w * 0.3 + value * w * 0.2) * pulseIntensity;

  // Central glow
  const gradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    glowRadius
  );
  gradient.addColorStop(0, color.glow);
  gradient.addColorStop(0.3, color.primary);
  gradient.addColorStop(0.7, `${color.secondary}88`);
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  // Light rays
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalAlpha = 0.3 * value;

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + time * 0.5;
    const rayLength = glowRadius * 1.5;

    ctx.strokeStyle = color.glow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
    ctx.stroke();
  }

  ctx.restore();

  // Sparkles
  ctx.fillStyle = color.glow;
  for (let i = 0; i < 10; i++) {
    const sparkleX = centerX + Math.sin(time * 3 + i * 0.7) * (w * 0.3);
    const sparkleY = centerY + Math.cos(time * 2 + i * 0.5) * (h * 0.3);
    const size = 2 + Math.sin(time * 5 + i) * 1;

    ctx.globalAlpha = 0.5 + Math.sin(time * 4 + i) * 0.3;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Swirl effect for Hate Inductance
function drawSwirlEffect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  value: number,
  time: number,
  color: GaugeConfig['color'],
  particles: Array<{ x: number; y: number; vx: number; vy: number; life: number }>
) {
  const centerX = w / 2;
  const centerY = h / 2;

  // Dark vortex background
  const vortexGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    w * 0.4
  );
  vortexGradient.addColorStop(0, '#000000');
  vortexGradient.addColorStop(0.5, color.secondary);
  vortexGradient.addColorStop(1, 'transparent');
  ctx.fillStyle = vortexGradient;
  ctx.fillRect(0, 0, w, h);

  // Swirling smoke/particles
  ctx.save();
  ctx.translate(centerX, centerY);

  // Draw spiraling tendrils
  for (let i = 0; i < 5; i++) {
    const baseAngle = time * (0.5 + value * 0.5) + (i * Math.PI * 2) / 5;

    ctx.strokeStyle = color.primary;
    ctx.lineWidth = 3 + value * 2;
    ctx.globalAlpha = 0.4 + value * 0.3;

    ctx.beginPath();
    for (let t = 0; t < 1; t += 0.02) {
      const spiralAngle = baseAngle + t * Math.PI * 2;
      const spiralRadius = t * w * 0.35 * (0.8 + Math.sin(time + i) * 0.2);
      const x = Math.cos(spiralAngle) * spiralRadius;
      const y = Math.sin(spiralAngle) * spiralRadius * 0.6;

      if (t === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }

  ctx.restore();

  // Update and draw particles
  particles.forEach((p, idx) => {
    // Move towards center with spiral
    const dx = centerX - p.x;
    const dy = centerY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Spiral force
    const angle = Math.atan2(dy, dx) + Math.PI / 2;
    p.vx += Math.cos(angle) * 0.1 * value;
    p.vy += Math.sin(angle) * 0.1 * value;

    // Pull towards center
    p.vx += dx * 0.001;
    p.vy += dy * 0.001;

    // Damping
    p.vx *= 0.98;
    p.vy *= 0.98;

    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.005;

    // Reset if dead or at center
    if (p.life <= 0 || dist < 10) {
      p.x = Math.random() * w;
      p.y = Math.random() * h;
      p.life = 1;
    }

    // Draw particle
    ctx.fillStyle = color.glow;
    ctx.globalAlpha = p.life * 0.5 * value;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2 + p.life * 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;

  // Red glow edge
  const edgeGradient = ctx.createLinearGradient(0, 0, w, 0);
  edgeGradient.addColorStop(0, `${color.glow}44`);
  edgeGradient.addColorStop(0.2, 'transparent');
  edgeGradient.addColorStop(0.8, 'transparent');
  edgeGradient.addColorStop(1, `${color.glow}44`);
  ctx.fillStyle = edgeGradient;
  ctx.fillRect(0, 0, w, h);
}

// Wave effect for Faith Frequency
function drawWaveEffect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  value: number,
  time: number,
  color: GaugeConfig['color']
) {
  const centerY = h / 2;

  // Multiple sine waves with different phases
  for (let layer = 0; layer < 3; layer++) {
    const amplitude = (h * 0.25 * value) / (layer + 1);
    const frequency = 0.03 + layer * 0.01;
    const phase = time * (2 + layer * 0.5);
    const opacity = 0.7 - layer * 0.2;

    ctx.strokeStyle = layer === 0 ? color.glow : color.primary;
    ctx.lineWidth = 4 - layer;
    ctx.globalAlpha = opacity;

    // Glow effect for main wave
    if (layer === 0) {
      ctx.shadowColor = color.glow;
      ctx.shadowBlur = 15;
    }

    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const y = centerY + Math.sin(x * frequency + phase) * amplitude;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();

    ctx.shadowBlur = 0;
  }

  ctx.globalAlpha = 1;

  // Frequency markers (vertical lines)
  ctx.strokeStyle = `${color.primary}44`;
  ctx.lineWidth = 1;
  for (let x = 30; x < w - 30; x += 30) {
    const heightMod = Math.sin(x * 0.05 + time) * 0.3 + 0.7;
    ctx.beginPath();
    ctx.moveTo(x, centerY - h * 0.3 * heightMod);
    ctx.lineTo(x, centerY + h * 0.3 * heightMod);
    ctx.stroke();
  }

  // Glow overlay at peaks
  const peakX = ((time * 50) % w);
  const gradient = ctx.createRadialGradient(peakX, centerY, 0, peakX, centerY, 30);
  gradient.addColorStop(0, `${color.glow}66`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
}

// Arrow effect for Intentionality
function drawArrowEffect(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  value: number,
  time: number,
  color: GaugeConfig['color']
) {
  const centerY = h / 2;

  // Flowing gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, w, 0);
  bgGradient.addColorStop(0, 'transparent');
  bgGradient.addColorStop(0.3, `${color.secondary}44`);
  bgGradient.addColorStop(0.7, `${color.primary}44`);
  bgGradient.addColorStop(1, `${color.glow}66`);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, w, h);

  // Directional flow lines
  ctx.strokeStyle = color.primary;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.3;

  for (let i = 0; i < 8; i++) {
    const yOffset = (i - 3.5) * (h / 10);
    const startX = ((time * 100 + i * 50) % (w + 100)) - 50;

    ctx.beginPath();
    ctx.moveTo(startX, centerY + yOffset);
    ctx.lineTo(startX + 40, centerY + yOffset);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;

  // Main arrow
  const arrowLength = w * 0.5 * value;
  const arrowX = w * 0.25;
  const arrowY = centerY;
  const arrowTipX = arrowX + arrowLength;

  // Arrow glow
  ctx.shadowColor = color.glow;
  ctx.shadowBlur = 20;

  // Arrow body gradient
  const arrowGradient = ctx.createLinearGradient(arrowX, 0, arrowTipX, 0);
  arrowGradient.addColorStop(0, color.secondary);
  arrowGradient.addColorStop(0.5, color.primary);
  arrowGradient.addColorStop(1, color.glow);

  // Draw arrow body
  ctx.fillStyle = arrowGradient;
  ctx.beginPath();
  ctx.moveTo(arrowX, arrowY - 8);
  ctx.lineTo(arrowTipX - 20, arrowY - 8);
  ctx.lineTo(arrowTipX - 20, arrowY - 15);
  ctx.lineTo(arrowTipX, arrowY);
  ctx.lineTo(arrowTipX - 20, arrowY + 15);
  ctx.lineTo(arrowTipX - 20, arrowY + 8);
  ctx.lineTo(arrowX, arrowY + 8);
  ctx.closePath();
  ctx.fill();

  ctx.shadowBlur = 0;

  // Trailing particles
  ctx.fillStyle = color.glow;
  for (let i = 0; i < 10; i++) {
    const particleX = arrowX + (Math.random() * arrowLength * 0.8);
    const particleY = centerY + (Math.random() - 0.5) * 20;
    const size = 1 + Math.random() * 2;
    ctx.globalAlpha = 0.3 + Math.random() * 0.4;
    ctx.beginPath();
    ctx.arc(particleX, particleY, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// Draw ornate capsule frame
function drawCapsuleFrame(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number
) {
  // Bronze/copper gradient for frame
  const frameGradient = ctx.createLinearGradient(x, y, x, y + h);
  frameGradient.addColorStop(0, '#cd853f');
  frameGradient.addColorStop(0.2, '#daa520');
  frameGradient.addColorStop(0.5, '#b8860b');
  frameGradient.addColorStop(0.8, '#8b7355');
  frameGradient.addColorStop(1, '#654321');

  ctx.strokeStyle = frameGradient;
  ctx.lineWidth = 6;

  // Draw capsule outline
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arc(x + w - radius, y + radius, radius, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + radius, y + h);
  ctx.arc(x + radius, y + radius, radius, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  ctx.stroke();

  // Inner highlight
  ctx.strokeStyle = '#ffd70044';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + radius + 5, y + 3);
  ctx.lineTo(x + w - radius - 5, y + 3);
  ctx.stroke();

  // Decorative screws/rivets at ends
  const rivetPositions = [
    { cx: x + radius * 0.7, cy: y + radius },
    { cx: x + w - radius * 0.7, cy: y + radius },
  ];

  rivetPositions.forEach(({ cx, cy }) => {
    // Rivet base
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Rivet highlight
    ctx.fillStyle = '#daa520';
    ctx.beginPath();
    ctx.arc(cx - 1, cy - 1, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// Main component
export const SoulLinkGauges: React.FC<SoulLinkGaugesProps> = ({
  coherence,
  features,
  regime,
}) => {
  return (
    <div className="w-full bg-cosmic-void rounded-lg border border-gauge-frame/30 p-4">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-cosmic text-cosmic-gold tracking-widest">
          CORE STATE VARIABLES
        </h2>
        <p className="text-sm text-cosmic-gold/50 italic">The Calculus of the Soul</p>
      </div>

      {/* Gauges */}
      <div className="space-y-4">
        {GAUGE_CONFIGS.map((config) => {
          const value = config.getValue({ coherence, features, regime });

          return (
            <div key={config.id} className="flex items-center gap-4">
              {/* Symbol and label */}
              <div className="w-24 text-right">
                <div className="flex items-baseline justify-end gap-1">
                  <span className="text-2xl font-serif italic text-cosmic-gold">
                    {config.symbol}
                  </span>
                  <span className="text-sm text-cosmic-gold/70">{config.label}</span>
                </div>
                {config.sublabel && (
                  <div className="text-xs text-cosmic-gold/50">{config.sublabel}</div>
                )}
              </div>

              {/* Gauge */}
              <div className="flex-1 h-14 relative">
                <GaugeCanvas config={config} value={value} width={280} height={56} />
              </div>

              {/* Description */}
              <div className="w-48 text-xs text-cosmic-gold/40 leading-tight">
                {config.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostic note */}
      <div className="mt-4 p-3 bg-cosmic-nebula/20 rounded border border-gauge-frame/10">
        <div className="text-xs text-cosmic-gold/60">
          <span className="text-cosmic-gold">// DIAGNOSTIC:</span> These metrics transform
          vague spiritual concepts into calculable physics.
        </div>
      </div>
    </div>
  );
};

export default SoulLinkGauges;
