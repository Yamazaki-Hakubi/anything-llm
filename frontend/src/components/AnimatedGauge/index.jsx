import React, { useEffect, useRef, useState } from "react";
import "./styles.css";

const AnimatedGauge = ({
  value = 65,
  min = 0,
  max = 100,
  dangerZone = [0, 30],
  goalZone = [70, 100],
  label = "Love Capacitance",
  unit = "Lc",
  size = 400,
  primaryColor = "#3b82f6",
  dangerColor = "#ef4444",
  goalColor = "#10b981",
}) => {
  const canvasRef = useRef(null);
  const [animatedValue, setAnimatedValue] = useState(min);
  const [rotation, setRotation] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Animate value change
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = (value - animatedValue) / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue((prev) => prev + increment);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [value]);

  // Continuous rotation animation
  useEffect(() => {
    const rotationTimer = setInterval(() => {
      setRotation((prev) => (prev + 0.5) % 360);
    }, 50);

    return () => clearInterval(rotationTimer);
  }, []);

  // Pulse animation
  useEffect(() => {
    const pulseTimer = setInterval(() => {
      setPulsePhase((prev) => (prev + 0.1) % (Math.PI * 2));
    }, 50);

    return () => clearInterval(pulseTimer);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.35;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw background glow
    const glowGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      radius * 1.5
    );
    glowGradient.addColorStop(0, "rgba(59, 130, 246, 0.1)");
    glowGradient.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, size, size);

    // Helper function to draw arc segments
    const drawArc = (startAngle, endAngle, color, lineWidth = 15) => {
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    // Convert value range to angles (start from top, go clockwise)
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * 0.85); // 85% of circle

    // Calculate angles for zones
    const angleRange = endAngle - startAngle;
    const valueRange = max - min;

    const getAngle = (val) => {
      return startAngle + ((val - min) / valueRange) * angleRange;
    };

    // Draw danger zone (red)
    const dangerStart = getAngle(dangerZone[0]);
    const dangerEnd = getAngle(dangerZone[1]);
    drawArc(dangerStart, dangerEnd, dangerColor, 12);

    // Draw goal zone (green/cyan)
    const goalStart = getAngle(goalZone[0]);
    const goalEnd = getAngle(goalZone[1]);
    drawArc(goalStart, goalEnd, goalColor, 12);

    // Draw middle zone (blue)
    const middleStart = dangerEnd;
    const middleEnd = goalStart;
    drawArc(middleStart, middleEnd, primaryColor, 12);

    // Draw current value indicator
    const valueAngle = getAngle(animatedValue);
    const indicatorLength = radius * 0.8;
    const indicatorX = centerX + Math.cos(valueAngle) * indicatorLength;
    const indicatorY = centerY + Math.sin(valueAngle) * indicatorLength;

    // Animated glow for indicator
    const pulseIntensity = 0.3 + Math.sin(pulsePhase) * 0.2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = primaryColor;

    // Draw indicator line
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(indicatorX, indicatorY);
    ctx.strokeStyle = `rgba(255, 255, 255, ${pulseIntensity + 0.7})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw indicator circle
    ctx.beginPath();
    ctx.arc(indicatorX, indicatorY, 8, 0, Math.PI * 2);
    ctx.fillStyle = primaryColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Draw rotating decorative rings
    const rotationRad = (rotation * Math.PI) / 180;
    for (let i = 0; i < 8; i++) {
      const angle = rotationRad + (i * Math.PI) / 4;
      const x1 = centerX + Math.cos(angle) * (radius + 20);
      const y1 = centerY + Math.sin(angle) * (radius + 20);
      const x2 = centerX + Math.cos(angle) * (radius + 30);
      const y2 = centerY + Math.sin(angle) * (radius + 30);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = `rgba(218, 165, 32, ${0.3 + Math.sin(pulsePhase + i) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Draw center circle
    const centerGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      30
    );
    centerGradient.addColorStop(0, "rgba(59, 130, 246, 0.3)");
    centerGradient.addColorStop(1, "rgba(30, 58, 138, 0.8)");
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = centerGradient;
    ctx.fill();
    ctx.strokeStyle = "rgba(218, 165, 32, 0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw symbols around the gauge
    ctx.font = "12px serif";
    ctx.fillStyle = "rgba(218, 165, 32, 0.7)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const symbols = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
    symbols.forEach((symbol, i) => {
      const angle = (i / symbols.length) * Math.PI * 2 - Math.PI / 2;
      const symbolX = centerX + Math.cos(angle) * (radius + 50);
      const symbolY = centerY + Math.sin(angle) * (radius + 50);
      ctx.fillText(symbol, symbolX, symbolY);
    });
  }, [
    animatedValue,
    rotation,
    pulsePhase,
    size,
    min,
    max,
    dangerZone,
    goalZone,
    primaryColor,
    dangerColor,
    goalColor,
  ]);

  return (
    <div className="animated-gauge-container">
      <div className="gauge-label">{label}</div>
      <div className="gauge-wrapper">
        <canvas
          ref={canvasRef}
          width={size}
          height={size}
          className="gauge-canvas"
        />
        <div className="gauge-value">
          {Math.round(animatedValue)}
          <span className="gauge-unit">{unit}</span>
        </div>
      </div>
      <div className="gauge-zones">
        <div className="zone-label danger">
          <span className="zone-dot" style={{ backgroundColor: dangerColor }}></span>
          Zone 1: Danger
        </div>
        <div className="zone-label goal">
          <span className="zone-dot" style={{ backgroundColor: goalColor }}></span>
          Zone 2: Goal
        </div>
      </div>
    </div>
  );
};

export default AnimatedGauge;
