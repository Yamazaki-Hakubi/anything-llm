/**
 * Memory Theater Component
 * Historical trades and learning progress visualization
 */

import React, { useState, useMemo } from 'react';
import type { TradeOutcome, LearningProgress, StrategyEvolution } from '../../core/types';

interface MemoryTheaterProps {
  trades: TradeOutcome[];
  learningProgress: LearningProgress[];
  onHistoricalSelect?: (trade: TradeOutcome) => void;
}

type ViewMode = 'trades' | 'learning' | 'evolution';

export const MemoryTheater: React.FC<MemoryTheaterProps> = ({
  trades,
  learningProgress,
  onHistoricalSelect,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('trades');
  const [selectedTrade, setSelectedTrade] = useState<TradeOutcome | null>(null);

  // Calculate trade statistics
  const stats = useMemo(() => {
    if (trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        avgPnL: 0,
        totalPnL: 0,
        bestTrade: null,
        worstTrade: null,
      };
    }

    const wins = trades.filter((t) => t.pnl > 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.pnl, 0);
    const avgPnL = totalPnL / trades.length;
    const sorted = [...trades].sort((a, b) => b.pnl - a.pnl);

    return {
      totalTrades: trades.length,
      winRate: (wins.length / trades.length) * 100,
      avgPnL,
      totalPnL,
      bestTrade: sorted[0],
      worstTrade: sorted[sorted.length - 1],
    };
  }, [trades]);

  // Equity curve calculation
  const equityCurve = useMemo(() => {
    let equity = 100000;
    return trades.map((trade) => {
      equity += trade.pnl;
      return {
        timestamp: trade.timestamp,
        equity,
        pnl: trade.pnl,
      };
    });
  }, [trades]);

  const handleTradeClick = (trade: TradeOutcome) => {
    setSelectedTrade(trade);
    onHistoricalSelect?.(trade);
  };

  return (
    <div className="w-full h-full bg-cosmic-void rounded-lg border border-gauge-frame/30 overflow-hidden">
      {/* Header with view modes */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gauge-frame/20">
        <h3 className="text-cosmic-gold font-cosmic text-sm">Memory Theater</h3>
        <div className="flex gap-2">
          {(['trades', 'learning', 'evolution'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              className={`
                px-3 py-1 rounded text-xs font-cosmic transition-all
                ${
                  viewMode === mode
                    ? 'bg-cosmic-gold/20 text-cosmic-gold border border-cosmic-gold/40'
                    : 'text-cosmic-gold/40 hover:text-cosmic-gold/60'
                }
              `}
              onClick={() => setViewMode(mode)}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex h-[calc(100%-48px)]">
        {/* Left panel - Visualization */}
        <div className="flex-1 p-4">
          {viewMode === 'trades' && (
            <div className="h-full">
              {/* Equity curve mini chart */}
              <div className="h-32 mb-4 relative">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#44ff88" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#44ff88" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {equityCurve.length > 1 && (
                    <>
                      {/* Area fill */}
                      <path
                        d={`
                          M 0 100
                          ${equityCurve
                            .map((point, i) => {
                              const x = (i / (equityCurve.length - 1)) * 100;
                              const minEquity = Math.min(...equityCurve.map((p) => p.equity));
                              const maxEquity = Math.max(...equityCurve.map((p) => p.equity));
                              const range = maxEquity - minEquity || 1;
                              const y = 100 - ((point.equity - minEquity) / range) * 80;
                              return `L ${x} ${y}`;
                            })
                            .join(' ')}
                          L 100 100
                          Z
                        `}
                        fill="url(#equityGradient)"
                      />

                      {/* Line */}
                      <path
                        d={equityCurve
                          .map((point, i) => {
                            const x = (i / (equityCurve.length - 1)) * 100;
                            const minEquity = Math.min(...equityCurve.map((p) => p.equity));
                            const maxEquity = Math.max(...equityCurve.map((p) => p.equity));
                            const range = maxEquity - minEquity || 1;
                            const y = 100 - ((point.equity - minEquity) / range) * 80;
                            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke="#44ff88"
                        strokeWidth="2"
                      />
                    </>
                  )}
                </svg>

                <div className="absolute top-0 left-0 text-xs text-cosmic-gold/60">
                  Equity Curve
                </div>
                <div className="absolute bottom-0 right-0 text-xs text-cosmic-energy-green">
                  ${equityCurve[equityCurve.length - 1]?.equity.toLocaleString() ?? '100,000'}
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                <div className="bg-cosmic-nebula/30 rounded p-2">
                  <div className="text-cosmic-gold/40">Total Trades</div>
                  <div className="text-cosmic-gold font-data">{stats.totalTrades}</div>
                </div>
                <div className="bg-cosmic-nebula/30 rounded p-2">
                  <div className="text-cosmic-gold/40">Win Rate</div>
                  <div
                    className={`font-data ${
                      stats.winRate > 50 ? 'text-cosmic-energy-green' : 'text-cosmic-energy-red'
                    }`}
                  >
                    {stats.winRate.toFixed(1)}%
                  </div>
                </div>
                <div className="bg-cosmic-nebula/30 rounded p-2">
                  <div className="text-cosmic-gold/40">Total P&L</div>
                  <div
                    className={`font-data ${
                      stats.totalPnL >= 0 ? 'text-cosmic-energy-green' : 'text-cosmic-energy-red'
                    }`}
                  >
                    ${stats.totalPnL.toFixed(0)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'learning' && (
            <div className="h-full overflow-auto">
              <div className="text-xs text-cosmic-gold/60 mb-2">Parameter Updates</div>
              {learningProgress.length === 0 ? (
                <div className="text-cosmic-gold/30 text-sm text-center py-8">
                  No learning updates yet
                </div>
              ) : (
                <div className="space-y-2">
                  {learningProgress.slice(0, 10).map((progress, i) => (
                    <div
                      key={i}
                      className="bg-cosmic-nebula/20 rounded p-2 border border-gauge-frame/10"
                    >
                      <div className="text-cosmic-gold text-xs mb-1">
                        {progress.strategyId}
                      </div>
                      <div className="text-cosmic-gold/40 text-[10px]">
                        {progress.parameterUpdates.slice(-1)[0]?.reason ?? 'Adapting...'}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="text-[10px] text-cosmic-energy-blue">
                          Δ: {(progress.performanceDelta * 100).toFixed(2)}%
                        </div>
                        <div className="text-[10px] text-cosmic-gold/30">
                          Updates: {progress.adaptationCount}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {viewMode === 'evolution' && (
            <div className="h-full flex items-center justify-center">
              <div className="text-cosmic-gold/30 text-sm">
                Strategy evolution timeline coming soon...
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Trade list */}
        <div className="w-64 border-l border-gauge-frame/20 overflow-auto">
          <div className="p-2 text-xs text-cosmic-gold/40 sticky top-0 bg-cosmic-void">
            Recent Trades
          </div>
          <div className="space-y-1 p-2">
            {trades.slice(-20).reverse().map((trade, i) => (
              <div
                key={trade.tradeId || i}
                className={`
                  p-2 rounded cursor-pointer transition-all text-xs
                  ${
                    selectedTrade === trade
                      ? 'bg-cosmic-gold/20 border border-cosmic-gold/40'
                      : 'bg-cosmic-nebula/20 hover:bg-cosmic-nebula/40'
                  }
                `}
                onClick={() => handleTradeClick(trade)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-cosmic-gold/60 truncate max-w-[80px]">
                    {trade.strategyId.slice(0, 12)}...
                  </span>
                  <span
                    className={`font-data ${
                      trade.pnl >= 0 ? 'text-cosmic-energy-green' : 'text-cosmic-energy-red'
                    }`}
                  >
                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between items-center mt-1 text-[10px] text-cosmic-gold/30">
                  <span>{new Date(trade.timestamp).toLocaleTimeString()}</span>
                  <span>{trade.wasCorrectDirection ? '✓' : '✗'}</span>
                </div>
              </div>
            ))}

            {trades.length === 0 && (
              <div className="text-cosmic-gold/30 text-center py-4">No trades yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Selected trade details */}
      {selectedTrade && (
        <div className="absolute bottom-0 left-0 right-0 bg-cosmic-deep border-t border-gauge-frame/30 p-3">
          <div className="flex justify-between items-center text-xs">
            <div>
              <span className="text-cosmic-gold/40">Entry:</span>
              <span className="text-cosmic-gold ml-1">${selectedTrade.entryPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-cosmic-gold/40">Exit:</span>
              <span className="text-cosmic-gold ml-1">${selectedTrade.exitPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-cosmic-gold/40">Hold:</span>
              <span className="text-cosmic-gold ml-1">
                {Math.floor(selectedTrade.holdingPeriod / 60000)}m
              </span>
            </div>
            <div>
              <span className="text-cosmic-gold/40">MaxDD:</span>
              <span className="text-cosmic-energy-red ml-1">
                {(selectedTrade.maxDrawdown * 100).toFixed(1)}%
              </span>
            </div>
            <button
              className="text-cosmic-gold/40 hover:text-cosmic-gold"
              onClick={() => setSelectedTrade(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoryTheater;
