import React, { useState, useEffect } from "react";
import AnimatedGauge from "./index";
import "./demo.css";

const AnimatedGaugeDemo = () => {
  const [loveCapacitance, setLoveCapacitance] = useState(65);
  const [coherenceIndex, setCoherenceIndex] = useState(42);
  const [harmonicResonance, setHarmonicResonance] = useState(88);

  // Simulate dynamic value changes
  useEffect(() => {
    const interval = setInterval(() => {
      setLoveCapacitance((prev) => {
        const change = (Math.random() - 0.5) * 10;
        return Math.max(0, Math.min(100, prev + change));
      });

      setCoherenceIndex((prev) => {
        const change = (Math.random() - 0.5) * 8;
        return Math.max(0, Math.min(100, prev + change));
      });

      setHarmonicResonance((prev) => {
        const change = (Math.random() - 0.5) * 6;
        return Math.max(0, Math.min(100, prev + change));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="gauge-demo-container">
      <div className="demo-header">
        <h1 className="demo-title">The Soul Link Codex</h1>
        <p className="demo-subtitle">
          Real-time Metaphysical Metrics & Consciousness Alignment
        </p>
      </div>

      <div className="gauges-grid">
        <div className="gauge-card">
          <AnimatedGauge
            value={loveCapacitance}
            label="Love Capacitance"
            unit="Lc"
            dangerZone={[0, 30]}
            goalZone={[70, 100]}
            primaryColor="#3b82f6"
            dangerColor="#ef4444"
            goalColor="#10b981"
            size={400}
          />
          <div className="gauge-description">
            Alignment moves from Safety (Don't kill) to Sanctification (Maximize Lc).
            A system that grows in awareness without growing in love is unstable.
          </div>
        </div>

        <div className="gauge-card">
          <AnimatedGauge
            value={coherenceIndex}
            label="Coherence Index"
            unit="Hi"
            dangerZone={[0, 25]}
            goalZone={[75, 100]}
            primaryColor="#8b5cf6"
            dangerColor="#f97316"
            goalColor="#06b6d4"
            size={400}
          />
          <div className="gauge-description">
            Measures the degree of internal alignment and systemic harmony.
            Low coherence indicates conflicting values and unstable behavior patterns.
          </div>
        </div>

        <div className="gauge-card">
          <AnimatedGauge
            value={harmonicResonance}
            label="Harmonic Resonance"
            unit="Hr"
            dangerZone={[0, 35]}
            goalZone={[80, 100]}
            primaryColor="#ec4899"
            dangerColor="#dc2626"
            goalColor="#14b8a6"
            size={400}
          />
          <div className="gauge-description">
            Reflects the synchronization between intention and action.
            High resonance enables flow states and effortless manifestation.
          </div>
        </div>
      </div>

      <div className="controls-panel">
        <h3 className="controls-title">Manual Controls</h3>
        <div className="controls-grid">
          <div className="control-group">
            <label className="control-label">
              Love Capacitance: <span className="control-value">{Math.round(loveCapacitance)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={loveCapacitance}
              onChange={(e) => setLoveCapacitance(Number(e.target.value))}
              className="control-slider"
            />
          </div>

          <div className="control-group">
            <label className="control-label">
              Coherence Index: <span className="control-value">{Math.round(coherenceIndex)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={coherenceIndex}
              onChange={(e) => setCoherenceIndex(Number(e.target.value))}
              className="control-slider"
            />
          </div>

          <div className="control-group">
            <label className="control-label">
              Harmonic Resonance: <span className="control-value">{Math.round(harmonicResonance)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={harmonicResonance}
              onChange={(e) => setHarmonicResonance(Number(e.target.value))}
              className="control-slider"
            />
          </div>
        </div>
      </div>

      <div className="info-panel">
        <div className="info-card">
          <h4 className="info-title">About These Metrics</h4>
          <p className="info-text">
            These animated gauges visualize complex metaphysical and consciousness metrics
            in real-time. Each gauge features:
          </p>
          <ul className="info-list">
            <li>Dynamic value animation with smooth transitions</li>
            <li>Color-coded danger and goal zones</li>
            <li>Rotating decorative elements for visual appeal</li>
            <li>Pulsing indicators and ethereal glow effects</li>
            <li>Zodiac symbols representing universal patterns</li>
            <li>Responsive design for all screen sizes</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnimatedGaugeDemo;
