/**
 * Coherence Visualizer Component
 * Cosmic Gauge style visualization inspired by the provided design
 * Features Zone 1 (Chaos/Decay), Zone 2 (Love/Growth), and central gauge
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { CoherenceScore, ActiveStrategy, VolatilityRegime } from '../../core/types';

interface CoherenceVisualizerProps {
  coherence: CoherenceScore | null;
  strategies: ActiveStrategy[];
  volatilityRegime?: VolatilityRegime;
}

interface WaveformPoint {
  x: number;
  y: number;
  timestamp: number;
}

interface ResonanceRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  growthRate: number;
}

export const CoherenceVisualizer: React.FC<CoherenceVisualizerProps> = ({
  coherence,
  strategies,
  volatilityRegime = 'normal',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const zone1CanvasRef = useRef<HTMLCanvasElement>(null);
  const zone2CanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [waveformPoints, setWaveformPoints] = useState<WaveformPoint[]>([]);
  const [resonanceRings, setResonanceRings] = useState<ResonanceRing[]>([]);
  const [needleAngle, setNeedleAngle] = useState(-45);

  // Calculate needle angle based on coherence
  useEffect(() => {
    if (coherence) {
      // Map coherence (0-1) to angle (-90 to 90 degrees)
      const targetAngle = (coherence.total - 0.5) * 180;
      setNeedleAngle((prev) => prev + (targetAngle - prev) * 0.1);
    }
  }, [coherence]);

  // Draw Zone 1 (Chaos/Decay - Red energy)
  const drawZone1 = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    const time = Date.now() / 1000;
    const decayRate = coherence ? 1 - coherence.total : 0.5;

    // Draw chaotic energy lines
    ctx.strokeStyle = `rgba(255, 68, 68, ${0.3 + decayRate * 0.5})`;
    ctx.lineWidth = 2;
    ctx.shadowColor = '#ff4444';
    ctx.shadowBlur = 10 * decayRate;

    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      for (let x = 0; x < width; x += 5) {
        const noise1 = Math.sin(x * 0.02 + time * 3 + i) * 30 * decayRate;
        const noise2 = Math.sin(x * 0.05 + time * 5 + i * 2) * 15 * decayRate;
        const noise3 = Math.random() * 10 * decayRate;
        const y = height / 2 + noise1 + noise2 + noise3;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    // Add lightning effect when decay is high
    if (decayRate > 0.6) {
      ctx.strokeStyle = `rgba(255, 200, 100, ${Math.random() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      let x = Math.random() * width * 0.3;
      let y = Math.random() * height;
      ctx.moveTo(x, y);

      for (let i = 0; i < 5; i++) {
        x += 20 + Math.random() * 40;
        y += (Math.random() - 0.5) * 60;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }, [coherence]);

  // Draw Zone 2 (Love/Growth - Blue sine waves)
  const drawZone2 = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    const time = Date.now() / 1000;
    const loveCapacitance = coherence?.total ?? 0.5;

    // Draw smooth sine waves
    for (let i = 0; i < 3; i++) {
      const amplitude = 20 + i * 10;
      const frequency = 0.015 + i * 0.005;
      const phase = time * (1 + i * 0.3);
      const opacity = 0.3 + loveCapacitance * 0.4 - i * 0.1;

      ctx.strokeStyle = `rgba(68, 136, 255, ${opacity})`;
      ctx.lineWidth = 3 - i * 0.5;
      ctx.shadowColor = '#4488ff';
      ctx.shadowBlur = 10 * loveCapacitance;

      ctx.beginPath();
      ctx.moveTo(0, height / 2);

      for (let x = 0; x < width; x += 2) {
        const y = height / 2 + Math.sin(x * frequency + phase) * amplitude * loveCapacitance;
        ctx.lineTo(x, y);
      }

      ctx.stroke();
    }

    // Add glow particles when coherence is high
    if (loveCapacitance > 0.7) {
      const particleCount = Math.floor(loveCapacitance * 10);
      ctx.fillStyle = `rgba(100, 200, 255, ${loveCapacitance * 0.5})`;

      for (let i = 0; i < particleCount; i++) {
        const x = (time * 50 + i * 30) % width;
        const y = height / 2 + Math.sin(x * 0.02 + time) * 30;
        const size = 2 + Math.sin(time * 3 + i) * 1;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;
  }, [coherence]);

  // Main gauge drawing
  const drawMainGauge = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.4;

    // Draw outer frame (golden)
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#5a4a00');
    gradient.addColorStop(0.5, '#c9a227');
    gradient.addColorStop(1, '#8b7500');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.stroke();

    // Draw inner circle (dark)
    ctx.fillStyle = '#0a0a1a';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Draw tick marks
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;

    for (let i = -90; i <= 90; i += 15) {
      const angle = (i * Math.PI) / 180;
      const innerR = radius - 15;
      const outerR = i % 45 === 0 ? radius - 5 : radius - 10;

      ctx.beginPath();
      ctx.moveTo(
        centerX + Math.cos(angle) * innerR,
        centerY + Math.sin(angle) * innerR
      );
      ctx.lineTo(
        centerX + Math.cos(angle) * outerR,
        centerY + Math.sin(angle) * outerR
      );
      ctx.stroke();
    }

    // Draw needle
    const needleLength = radius - 25;
    const needleAngleRad = ((needleAngle - 90) * Math.PI) / 180;

    // Needle shadow
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(needleAngleRad) * needleLength,
      centerY + Math.sin(needleAngleRad) * needleLength
    );
    ctx.stroke();

    // Needle center circle
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // Draw coherence value
    ctx.fillStyle = '#c9a227';
    ctx.font = '14px Orbitron, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${((coherence?.total ?? 0) * 100).toFixed(0)}%`,
      centerX,
      centerY + radius + 30
    );
  }, [needleAngle, coherence]);

  // Add resonance ring effect
  const addResonanceRing = useCallback(() => {
    if (coherence && coherence.total > 0.7) {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const newRing: ResonanceRing = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 10,
        maxRadius: 100 * coherence.total,
        alpha: 1,
        growthRate: 2 + coherence.total * 3,
      };

      setResonanceRings((prev) => [...prev, newRing]);
    }
  }, [coherence]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const zone1Canvas = zone1CanvasRef.current;
    const zone2Canvas = zone2CanvasRef.current;

    if (!canvas || !zone1Canvas || !zone2Canvas) return;

    const ctx = canvas.getContext('2d');
    const zone1Ctx = zone1Canvas.getContext('2d');
    const zone2Ctx = zone2Canvas.getContext('2d');

    if (!ctx || !zone1Ctx || !zone2Ctx) return;

    const animate = () => {
      drawZone1(zone1Ctx, zone1Canvas.width, zone1Canvas.height);
      drawZone2(zone2Ctx, zone2Canvas.width, zone2Canvas.height);
      drawMainGauge(ctx, canvas.width, canvas.height);

      // Update resonance rings
      setResonanceRings((prev) =>
        prev
          .map((ring) => ({
            ...ring,
            radius: ring.radius + ring.growthRate,
            alpha: ring.alpha - 0.02,
          }))
          .filter((ring) => ring.alpha > 0 && ring.radius < ring.maxRadius)
      );

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Add resonance rings periodically when coherence is high
    const ringInterval = setInterval(addResonanceRing, 2000);

    return () => {
      cancelAnimationFrame(animationRef.current);
      clearInterval(ringInterval);
    };
  }, [drawZone1, drawZone2, drawMainGauge, addResonanceRing]);

  // Calculate sub-gauge values
  const decayRate = coherence ? 1 - coherence.structural : 0.5;
  const growthIndex = coherence?.temporal ?? 0.5;

  return (
    <div className="relative w-full h-64 bg-cosmic-void rounded-lg border border-gauge-frame/50 overflow-hidden">
      {/* Cosmic background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: 'radial-gradient(ellipse at center, #1a1a3a 0%, #0a0a1a 100%)',
        }}
      />

      {/* Main frame (golden ornate border) */}
      <div className="absolute inset-2 border-4 border-gauge-frame rounded-lg shadow-cosmic-glow">
        <div className="flex h-full">
          {/* Zone 1 - Chaos/Decay */}
          <div className="flex-1 relative border-r border-gauge-frame/30">
            <div className="absolute top-2 left-2 text-xs text-cosmic-zone1-bright font-cosmic">
              ZONE 1
            </div>
            <canvas
              ref={zone1CanvasRef}
              width={200}
              height={180}
              className="w-full h-full"
            />
            {/* Decay Rate sub-gauge */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-xs text-cosmic-zone1-glow mb-1">DECAY RATE</div>
              <div className="h-2 bg-cosmic-zone1-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cosmic-zone1-mid to-cosmic-zone1-bright transition-all duration-300"
                  style={{ width: `${decayRate * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center Gauge */}
          <div className="w-48 relative flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={192}
              height={192}
              className="absolute inset-0"
            />
            {/* Resonance rings overlay */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              {resonanceRings.map((ring, i) => (
                <circle
                  key={i}
                  cx="50%"
                  cy="50%"
                  r={ring.radius}
                  fill="none"
                  stroke={`rgba(0, 255, 255, ${ring.alpha})`}
                  strokeWidth="2"
                />
              ))}
            </svg>
          </div>

          {/* Zone 2 - Love/Growth */}
          <div className="flex-1 relative border-l border-gauge-frame/30">
            <div className="absolute top-2 right-2 text-xs text-cosmic-zone2-bright font-cosmic">
              ZONE 2
            </div>
            <div className="absolute top-2 left-2 text-xs text-cosmic-zone2-glow">
              LOVE CAPACITANCE (1-∞)
            </div>
            <canvas
              ref={zone2CanvasRef}
              width={200}
              height={180}
              className="w-full h-full"
            />
            {/* Growth Index sub-gauge */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="text-xs text-cosmic-zone2-glow mb-1">GROWTH INDEX</div>
              <div className="h-2 bg-cosmic-zone2-dark rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cosmic-zone2-mid to-cosmic-zone2-bright transition-all duration-300"
                  style={{ width: `${growthIndex * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom mini gauges */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-8 pb-2">
          {[
            { label: 'STR', value: coherence?.structural ?? 0 },
            { label: 'TMP', value: coherence?.temporal ?? 0 },
            { label: 'FRC', value: coherence?.fractal ?? 0 },
            { label: 'CNV', value: coherence?.convergence ?? 0 },
          ].map((gauge, i) => (
            <div key={i} className="w-10 h-10 relative">
              <svg viewBox="0 0 40 40" className="w-full h-full">
                {/* Background arc */}
                <path
                  d="M 5 25 A 15 15 0 0 1 35 25"
                  fill="none"
                  stroke="#1a1a3a"
                  strokeWidth="4"
                />
                {/* Value arc */}
                <path
                  d="M 5 25 A 15 15 0 0 1 35 25"
                  fill="none"
                  stroke={gauge.value > 0.6 ? '#44ff88' : gauge.value > 0.3 ? '#ffaa44' : '#ff4444'}
                  strokeWidth="4"
                  strokeDasharray={`${gauge.value * 47} 47`}
                />
              </svg>
              <div className="absolute bottom-0 left-0 right-0 text-center text-[8px] text-cosmic-gold">
                {gauge.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CoherenceVisualizer;
