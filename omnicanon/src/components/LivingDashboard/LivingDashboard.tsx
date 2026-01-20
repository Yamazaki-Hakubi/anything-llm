/**
 * Living Dashboard Component
 * Top-level dashboard with real-time metrics and status
 */

import React, { useState, useEffect, useCallback } from 'react';
import type { SystemState, Portfolio, Regime } from '../../core/types';

interface LivingDashboardProps {
  systemState: SystemState | null;
  onAttentionChange?: (attention: { x: number; y: number }) => void;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'green' | 'red' | 'gold' | 'blue' | 'purple';
  pulsing?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  trend,
  color = 'gold',
  pulsing = false,
}) => {
  const colorClasses = {
    green: 'text-cosmic-energy-green border-cosmic-energy-green/30',
    red: 'text-cosmic-energy-red border-cosmic-energy-red/30',
    gold: 'text-cosmic-gold border-gauge-frame/30',
    blue: 'text-cosmic-energy-blue border-cosmic-energy-blue/30',
    purple: 'text-cosmic-energy-purple border-cosmic-energy-purple/30',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div
      className={`
        relative p-3 rounded-lg border bg-cosmic-void/50 backdrop-blur
        ${colorClasses[color]}
        ${pulsing ? 'animate-pulse-slow' : ''}
      `}
    >
      <div className="text-xs opacity-60 mb-1 font-cosmic">{label}</div>
      <div className="text-xl font-bold font-data flex items-center gap-2">
        {value}
        {trend && (
          <span
            className={`text-sm ${
              trend === 'up' ? 'text-cosmic-energy-green' : trend === 'down' ? 'text-cosmic-energy-red' : ''
            }`}
          >
            {trendIcons[trend]}
          </span>
        )}
      </div>
      {subValue && <div className="text-xs opacity-40 mt-1">{subValue}</div>}

      {/* Decorative corner */}
      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-current opacity-30 rounded-tr-lg" />
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-current opacity-30 rounded-bl-lg" />
    </div>
  );
};

const RegimeIndicator: React.FC<{ regime: Regime | null }> = ({ regime }) => {
  const regimeColors: Record<string, string> = {
    trending_bullish: '#44ff88',
    trending_bearish: '#ff4444',
    range_bound: '#4488ff',
    breakout: '#88ff44',
    breakdown: '#ff8844',
    consolidation: '#888888',
    high_volatility: '#ff44ff',
    low_volatility: '#44ffff',
    gamma_squeeze: '#ffff44',
    mean_reversion: '#8844ff',
  };

  const regimeLabels: Record<string, string> = {
    trending_bullish: 'TREND ↑',
    trending_bearish: 'TREND ↓',
    range_bound: 'RANGE',
    breakout: 'BREAKOUT',
    breakdown: 'BREAKDOWN',
    consolidation: 'CONSOLIDATE',
    high_volatility: 'HIGH VOL',
    low_volatility: 'LOW VOL',
    gamma_squeeze: 'γ SQUEEZE',
    mean_reversion: 'REVERSION',
  };

  if (!regime) {
    return (
      <div className="flex items-center gap-2 text-cosmic-gold/40">
        <div className="w-3 h-3 rounded-full bg-current animate-pulse" />
        <span className="text-sm font-cosmic">INITIALIZING</span>
      </div>
    );
  }

  const color = regimeColors[regime.type] ?? '#c9a227';
  const label = regimeLabels[regime.type] ?? regime.type.toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-4 h-4 rounded-full animate-pulse"
        style={{
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}`,
        }}
      />
      <div>
        <div className="text-sm font-cosmic" style={{ color }}>
          {label}
        </div>
        <div className="text-xs text-cosmic-gold/40">
          {(regime.confidence * 100).toFixed(0)}% conf
        </div>
      </div>
    </div>
  );
};

const SystemHealthBar: React.FC<{ health: SystemState['systemHealth'] | undefined }> = ({ health }) => {
  if (!health) return null;

  const getHealthColor = (value: number, inverse = false) => {
    const v = inverse ? 1 - value : value;
    if (v > 0.7) return '#44ff88';
    if (v > 0.3) return '#ffaa44';
    return '#ff4444';
  };

  return (
    <div className="flex items-center gap-4 text-xs">
      <div className="flex items-center gap-1">
        <span className="text-cosmic-gold/40">LAT:</span>
        <span style={{ color: getHealthColor(1 - health.dataLatency / 1000) }}>
          {health.dataLatency.toFixed(0)}ms
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-cosmic-gold/40">PROC:</span>
        <span style={{ color: getHealthColor(1 - health.processingTime / 100) }}>
          {health.processingTime.toFixed(1)}ms
        </span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-cosmic-gold/40">MEM:</span>
        <span className="text-cosmic-gold">{health.memoryUsage}</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-cosmic-gold/40">ERR:</span>
        <span style={{ color: getHealthColor(1 - health.errorRate) }}>
          {(health.errorRate * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
};

export const LivingDashboard: React.FC<LivingDashboardProps> = ({
  systemState,
  onAttentionChange,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Track mouse for attention
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (onAttentionChange) {
        const rect = e.currentTarget.getBoundingClientRect();
        onAttentionChange({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }
    },
    [onAttentionChange]
  );

  const portfolio = systemState?.portfolio;
  const regime = systemState?.regime ?? null;
  const coherence = systemState?.coherenceScore;

  // Calculate portfolio metrics
  const totalPnL = portfolio ? portfolio.unrealizedPnL + portfolio.realizedPnL : 0;
  const pnlPercent = portfolio ? (totalPnL / (portfolio.totalValue - totalPnL)) * 100 : 0;
  const pnlTrend = pnlPercent > 0 ? 'up' : pnlPercent < 0 ? 'down' : 'neutral';

  return (
    <div
      className="w-full bg-cosmic-void border-b border-gauge-frame/30 px-6 py-4"
      onMouseMove={handleMouseMove}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-cosmic text-cosmic-gold tracking-wider">
            OMNICANON
          </h1>
          <RegimeIndicator regime={regime} />
        </div>

        <div className="flex items-center gap-6">
          <SystemHealthBar health={systemState?.systemHealth} />
          <div className="text-cosmic-gold font-data text-sm">
            {currentTime.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-6 gap-4">
        <MetricCard
          label="PORTFOLIO VALUE"
          value={`$${(portfolio?.totalValue ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          subValue={`${portfolio?.positions.length ?? 0} positions`}
          color="gold"
        />

        <MetricCard
          label="TOTAL P&L"
          value={`${totalPnL >= 0 ? '+' : ''}$${totalPnL.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          subValue={`${pnlPercent >= 0 ? '+' : ''}${pnlPercent.toFixed(2)}%`}
          trend={pnlTrend as 'up' | 'down' | 'neutral'}
          color={totalPnL >= 0 ? 'green' : 'red'}
        />

        <MetricCard
          label="COHERENCE"
          value={`${((coherence?.total ?? 0) * 100).toFixed(0)}%`}
          subValue={`Conf: ${((coherence?.confidence ?? 0) * 100).toFixed(0)}%`}
          color="blue"
          pulsing={(coherence?.total ?? 0) > 0.7}
        />

        <MetricCard
          label="ACTIVE STRATEGIES"
          value={systemState?.activeStrategies.length ?? 0}
          subValue={`${systemState?.signals.length ?? 0} signals`}
          color="purple"
        />

        <MetricCard
          label="WIN RATE"
          value={`${(systemState?.recentTrades.filter((t) => t.pnl > 0).length ?? 0)} / ${systemState?.recentTrades.length ?? 0}`}
          subValue={`${(((systemState?.recentTrades.filter((t) => t.pnl > 0).length ?? 0) / (systemState?.recentTrades.length || 1)) * 100).toFixed(0)}%`}
          color={
            (systemState?.recentTrades.filter((t) => t.pnl > 0).length ?? 0) /
              (systemState?.recentTrades.length || 1) >
            0.5
              ? 'green'
              : 'red'
          }
        />

        <MetricCard
          label="DAILY P&L"
          value={`${(portfolio?.dailyPnL ?? 0) >= 0 ? '+' : ''}$${(portfolio?.dailyPnL ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          subValue={`DD: ${((portfolio?.currentDrawdown ?? 0) * 100).toFixed(1)}%`}
          trend={(portfolio?.dailyPnL ?? 0) >= 0 ? 'up' : 'down'}
          color={(portfolio?.dailyPnL ?? 0) >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Coherence bar */}
      <div className="mt-4">
        <div className="flex items-center gap-4">
          <span className="text-xs text-cosmic-gold/60 w-20">COHERENCE</span>
          <div className="flex-1 h-2 bg-cosmic-nebula rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${(coherence?.total ?? 0) * 100}%`,
                background: `linear-gradient(90deg,
                  ${(coherence?.total ?? 0) < 0.3 ? '#ff4444' : (coherence?.total ?? 0) < 0.6 ? '#ffaa44' : '#44ff88'} 0%,
                  ${(coherence?.total ?? 0) < 0.3 ? '#ff6666' : (coherence?.total ?? 0) < 0.6 ? '#ffcc44' : '#66ff99'} 100%
                )`,
                boxShadow: (coherence?.total ?? 0) > 0.7 ? '0 0 10px #44ff88' : 'none',
              }}
            />
          </div>
          <span className="text-xs text-cosmic-gold w-12 text-right">
            {((coherence?.total ?? 0) * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default LivingDashboard;
