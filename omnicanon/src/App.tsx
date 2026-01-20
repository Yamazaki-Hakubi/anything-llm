/**
 * OMNICANON Main Application
 * Fractal-Resonant Trading System GUI
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ConstraintField3D,
  CoherenceVisualizer,
  PatternRadar,
  LivingDashboard,
  MemoryTheater,
  RegimeCompass,
  SoulLinkGauges,
} from './components';
import { OmnicanonSystem } from './core';
import type { SystemState, MarketData, UserAttention, InteractionMode } from './core/types';
import { generateMockMarketData } from './utils/mockData';

type VisualizationMode = 'constraint' | 'gamma' | 'liquidity' | 'volatility';

const App: React.FC = () => {
  const [systemState, setSystemState] = useState<SystemState | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>('constraint');
  const [userAttention, setUserAttention] = useState<UserAttention>({
    x: 0.5,
    y: 0.5,
    focus: 'gamma',
    zoomLevel: 1,
  });
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('explore');
  const [isRunning, setIsRunning] = useState(true);

  // Initialize system
  const system = useMemo(() => new OmnicanonSystem(), []);

  // Main update loop
  useEffect(() => {
    if (!isRunning) return;

    const updateInterval = setInterval(async () => {
      // Generate mock market data (in production, this would come from WebSocket)
      const marketData = generateMockMarketData();

      // Process through the system
      const newState = await system.rootFunction(marketData);
      setSystemState(newState);
    }, 1000); // Update every second

    return () => clearInterval(updateInterval);
  }, [system, isRunning]);

  // Handle 3D interaction
  const handle3DInteraction = useCallback(
    (data: { type: string; position: { x: number; y: number; z: number } }) => {
      console.log('3D Interaction:', data);
    },
    []
  );

  // Handle strategy click from radar
  const handleStrategyClick = useCallback((strategy: any) => {
    console.log('Strategy selected:', strategy.template.name);
  }, []);

  // Handle trade selection from memory theater
  const handleTradeSelect = useCallback((trade: any) => {
    console.log('Trade selected:', trade.tradeId);
  }, []);

  return (
    <div className="min-h-screen bg-cosmic-void text-white font-data">
      {/* Background stars effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-cosmic-gradient" />
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animation: 'twinkle 3s ease-in-out infinite',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10">
        {/* Top Dashboard */}
        <LivingDashboard
          systemState={systemState}
          onAttentionChange={(attention) =>
            setUserAttention((prev) => ({ ...prev, ...attention }))
          }
        />

        {/* Main content area */}
        <div className="flex p-4 gap-4" style={{ height: 'calc(100vh - 180px)' }}>
          {/* Left Panel */}
          <div className="w-80 flex flex-col gap-4">
            {/* Soul Link Gauges */}
            <SoulLinkGauges
              coherence={systemState?.coherenceScore ?? null}
              features={systemState?.structuralFeatures ?? null}
              regime={systemState?.regime ?? null}
            />

            {/* Regime Compass */}
            <RegimeCompass
              regime={systemState?.regime ?? null}
              confidence={systemState?.regime?.confidence ?? 0}
            />
          </div>

          {/* Center Panel - 3D Constraint Field */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex-1 relative">
              <ConstraintField3D
                structuralFeatures={systemState?.structuralFeatures ?? null}
                userAttention={userAttention}
                interactionMode={interactionMode}
                onInteraction={handle3DInteraction}
              />

              {/* Mode controls overlay */}
              <div className="absolute top-4 right-4 flex gap-2">
                {(['constraint', 'gamma', 'liquidity', 'volatility'] as VisualizationMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      className={`
                        px-3 py-1.5 rounded text-xs font-cosmic transition-all
                        ${
                          visualizationMode === mode
                            ? 'bg-cosmic-gold/30 text-cosmic-gold border border-cosmic-gold'
                            : 'bg-cosmic-void/80 text-cosmic-gold/50 border border-gauge-frame/30 hover:border-cosmic-gold/50'
                        }
                      `}
                      onClick={() => setVisualizationMode(mode)}
                    >
                      {mode.toUpperCase()}
                    </button>
                  )
                )}
              </div>

              {/* Interaction mode controls */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                {(['explore', 'analyze', 'trade'] as InteractionMode[]).map((mode) => (
                  <button
                    key={mode}
                    className={`
                      px-3 py-1.5 rounded text-xs font-cosmic transition-all
                      ${
                        interactionMode === mode
                          ? 'bg-cosmic-energy-blue/30 text-cosmic-energy-blue border border-cosmic-energy-blue'
                          : 'bg-cosmic-void/80 text-cosmic-gold/50 border border-gauge-frame/30 hover:border-cosmic-energy-blue/50'
                      }
                    `}
                    onClick={() => setInteractionMode(mode)}
                  >
                    {mode.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Play/Pause control */}
              <div className="absolute bottom-4 right-4">
                <button
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${
                      isRunning
                        ? 'bg-cosmic-energy-green/20 text-cosmic-energy-green border border-cosmic-energy-green'
                        : 'bg-cosmic-energy-red/20 text-cosmic-energy-red border border-cosmic-energy-red'
                    }
                  `}
                  onClick={() => setIsRunning(!isRunning)}
                >
                  {isRunning ? '⏸' : '▶'}
                </button>
              </div>
            </div>

            {/* Coherence Visualizer */}
            <CoherenceVisualizer
              coherence={systemState?.coherenceScore ?? null}
              strategies={systemState?.activeStrategies ?? []}
              volatilityRegime={systemState?.structuralFeatures?.volatilityRegime.regime}
            />
          </div>

          {/* Right Panel */}
          <div className="w-80 flex flex-col gap-4">
            {/* Pattern Radar */}
            <PatternRadar
              strategies={systemState?.activeStrategies ?? []}
              signals={systemState?.signals ?? []}
              onBlipClick={handleStrategyClick}
            />

            {/* Memory Theater */}
            <div className="flex-1">
              <MemoryTheater
                trades={systemState?.recentTrades ?? []}
                learningProgress={systemState?.learningProgress ?? []}
                onHistoricalSelect={handleTradeSelect}
              />
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-cosmic-deep/90 border-t border-gauge-frame/30 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4 text-cosmic-gold/60">
            <span>OMNICANON v1.0.0</span>
            <span>|</span>
            <span className={isRunning ? 'text-cosmic-energy-green' : 'text-cosmic-energy-red'}>
              {isRunning ? 'LIVE' : 'PAUSED'}
            </span>
          </div>

          <div className="flex items-center gap-4 text-cosmic-gold/40">
            <span>Patterns: {system.getMemoryStats().totalPatterns}</span>
            <span>|</span>
            <span>
              Performance: {((system.getPerformance().winRate ?? 0) * 100).toFixed(1)}% WR
            </span>
            <span>|</span>
            <span
              className={
                system.isKillSwitchActive() ? 'text-cosmic-energy-red' : 'text-cosmic-energy-green'
              }
            >
              Risk: {system.isKillSwitchActive() ? 'HALTED' : 'OK'}
            </span>
          </div>
        </div>
      </div>

      {/* Global styles for animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

export default App;
