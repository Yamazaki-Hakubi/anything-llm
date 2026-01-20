/**
 * Learning Engine
 * Outcome analysis and strategy evolution
 */

import type {
  ExecutionResult,
  StructuralFeatures,
  TradeOutcome,
  LearningProgress,
  StrategyPerformance,
  StrategyEvolution,
  Signal,
} from '../types';
import { CircularBuffer } from '../../utils/circularBuffer';
import {
  mean,
  standardDeviation,
  sharpeRatio,
  maxDrawdown,
  correlation,
  cosineSimilarity,
} from '../../utils/math';

interface ParameterUpdate {
  parameter: string;
  oldValue: number;
  newValue: number;
  reason: string;
  timestamp: number;
}

export class LearningEngine {
  private tradeOutcomes: CircularBuffer<TradeOutcome>;
  private learningProgress: Map<string, LearningProgress>;
  private strategyEvolutions: Map<string, StrategyEvolution>;
  private featureImportance: Map<string, number>;

  constructor() {
    this.tradeOutcomes = new CircularBuffer(10000);
    this.learningProgress = new Map();
    this.strategyEvolutions = new Map();
    this.featureImportance = new Map();

    this.initializeFeatureImportance();
  }

  private initializeFeatureImportance(): void {
    // Initial feature importance weights
    const features = [
      'momentum',
      'trendStrength',
      'volatility',
      'gammaConcentration',
      'liquidityImbalance',
      'dealerFlow',
      'coherence',
      'regimeConfidence',
    ];

    for (const feature of features) {
      this.featureImportance.set(feature, 1 / features.length);
    }
  }

  analyzeOutcome(
    executionResult: ExecutionResult,
    entryFeatures: StructuralFeatures,
    exitFeatures: StructuralFeatures,
    signal: Signal
  ): TradeOutcome {
    const { order } = executionResult;

    // Calculate P&L
    const pnl =
      order.side === 'buy'
        ? (exitFeatures.priceHistory.prices[exitFeatures.priceHistory.prices.length - 1] -
            order.avgFillPrice) *
          order.filledSize
        : (order.avgFillPrice -
            exitFeatures.priceHistory.prices[exitFeatures.priceHistory.prices.length - 1]) *
          order.filledSize;

    const pnlPercent = pnl / (order.avgFillPrice * order.filledSize);

    // Calculate holding period
    const holdingPeriod = (order.filledAt ?? Date.now()) - order.submittedAt;

    // Calculate max drawdown during trade (simplified)
    const pricesDuringTrade = exitFeatures.priceHistory.prices.slice(-Math.ceil(holdingPeriod / 1000));
    const mddt = maxDrawdown(pricesDuringTrade);

    // Calculate max runup
    const maxRunup = this.calculateMaxRunup(pricesDuringTrade, order.side);

    // Was direction correct?
    const wasCorrectDirection =
      (signal.direction === 'long' && pnl > 0) ||
      (signal.direction === 'short' && pnl > 0);

    // Calculate execution quality
    const executionQuality = this.calculateExecutionQuality(
      executionResult,
      signal
    );

    const outcome: TradeOutcome = {
      tradeId: order.id,
      signalId: signal.id,
      strategyId: signal.strategyId,
      entryPrice: order.avgFillPrice,
      exitPrice: exitFeatures.priceHistory.prices[exitFeatures.priceHistory.prices.length - 1],
      size: order.filledSize,
      pnl,
      pnlPercent,
      holdingPeriod,
      maxDrawdown: mddt,
      maxRunup,
      structuralFeaturesAtEntry: entryFeatures,
      structuralFeaturesAtExit: exitFeatures,
      wasCorrectDirection,
      executionQuality,
      timestamp: Date.now(),
    };

    this.tradeOutcomes.add(outcome);
    this.updateStrategyPerformance(outcome);
    this.updateFeatureImportance(outcome);

    return outcome;
  }

  private calculateMaxRunup(prices: number[], side: 'buy' | 'sell'): number {
    if (prices.length < 2) return 0;

    const entry = prices[0];
    let maxRunup = 0;

    for (const price of prices) {
      const runup =
        side === 'buy'
          ? (price - entry) / entry
          : (entry - price) / entry;

      if (runup > maxRunup) {
        maxRunup = runup;
      }
    }

    return maxRunup;
  }

  private calculateExecutionQuality(
    result: ExecutionResult,
    signal: Signal
  ): number {
    let quality = 0;

    // Fill rate (full fill = good)
    const fillRate = result.order.filledSize / (result.order.size || 1);
    quality += fillRate * 0.3;

    // Slippage vs expected
    const expectedSlippage = signal.entryPrice * 0.001; // Expected 10 bps
    const slippageRatio = Math.max(
      0,
      1 - Math.abs(result.slippage) / expectedSlippage
    );
    quality += slippageRatio * 0.4;

    // Speed (faster = better)
    const speedScore = Math.max(0, 1 - result.executionTime / 1000);
    quality += speedScore * 0.3;

    return Math.min(quality, 1);
  }

  private updateStrategyPerformance(outcome: TradeOutcome): void {
    const strategyId = outcome.strategyId;
    const outcomes = this.tradeOutcomes
      .toArray()
      .filter((o) => o.strategyId === strategyId);

    if (outcomes.length === 0) return;

    // Calculate performance metrics
    const pnls = outcomes.map((o) => o.pnlPercent);
    const wins = outcomes.filter((o) => o.pnl > 0).length;

    const winRate = wins / outcomes.length;
    const avgWin =
      mean(pnls.filter((p) => p > 0).map((p) => p)) || 0;
    const avgLoss =
      Math.abs(mean(pnls.filter((p) => p < 0).map((p) => p))) || 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;

    const equity = this.calculateEquityCurve(outcomes);
    const sr = sharpeRatio(pnls);
    const mdd = maxDrawdown(equity);

    // Recent performance (last 20 trades)
    const recentPnls = pnls.slice(-20);
    const recentPerformance = mean(recentPnls);

    // Adaptation score (how much we've improved)
    const firstHalf = pnls.slice(0, Math.floor(pnls.length / 2));
    const secondHalf = pnls.slice(Math.floor(pnls.length / 2));
    const adaptationScore =
      secondHalf.length > 0 && firstHalf.length > 0
        ? mean(secondHalf) - mean(firstHalf)
        : 0;

    const performance: StrategyPerformance = {
      totalTrades: outcomes.length,
      winRate,
      profitFactor,
      sharpeRatio: sr,
      maxDrawdown: mdd,
      recentPerformance,
      adaptationScore,
    };

    // Update learning progress
    this.updateLearningProgress(strategyId, performance, outcome);

    // Update strategy evolution
    this.updateStrategyEvolution(strategyId, performance);
  }

  private calculateEquityCurve(outcomes: TradeOutcome[]): number[] {
    let equity = 100000; // Starting equity
    const curve: number[] = [equity];

    for (const outcome of outcomes) {
      equity += outcome.pnl;
      curve.push(equity);
    }

    return curve;
  }

  private updateLearningProgress(
    strategyId: string,
    performance: StrategyPerformance,
    latestOutcome: TradeOutcome
  ): void {
    const existing = this.learningProgress.get(strategyId);
    const updates: ParameterUpdate[] = existing?.parameterUpdates ?? [];

    // Determine if parameter adjustments are needed
    const adjustments = this.suggestParameterAdjustments(
      strategyId,
      performance,
      latestOutcome
    );

    for (const adj of adjustments) {
      updates.push(adj);
    }

    // Keep only last 100 updates
    const recentUpdates = updates.slice(-100);

    const progress: LearningProgress = {
      strategyId,
      parameterUpdates: recentUpdates,
      performanceDelta: performance.adaptationScore,
      adaptationCount: recentUpdates.length,
    };

    this.learningProgress.set(strategyId, progress);
  }

  private suggestParameterAdjustments(
    strategyId: string,
    performance: StrategyPerformance,
    latestOutcome: TradeOutcome
  ): ParameterUpdate[] {
    const adjustments: ParameterUpdate[] = [];

    // Poor win rate - adjust entry criteria
    if (performance.winRate < 0.4 && performance.totalTrades > 20) {
      adjustments.push({
        parameter: 'activationThreshold',
        oldValue: 0.6,
        newValue: 0.7,
        reason: `Low win rate (${(performance.winRate * 100).toFixed(1)}%) - tightening entry criteria`,
        timestamp: Date.now(),
      });
    }

    // Poor risk/reward - adjust stops/targets
    if (performance.profitFactor < 1 && performance.totalTrades > 30) {
      adjustments.push({
        parameter: 'stopLossMultiple',
        oldValue: 1.0,
        newValue: 0.8,
        reason: `Low profit factor (${performance.profitFactor.toFixed(2)}) - tightening stops`,
        timestamp: Date.now(),
      });
    }

    // High drawdown - reduce position sizing
    if (performance.maxDrawdown > 0.15) {
      adjustments.push({
        parameter: 'positionSizeMultiple',
        oldValue: 1.0,
        newValue: 0.7,
        reason: `High drawdown (${(performance.maxDrawdown * 100).toFixed(1)}%) - reducing size`,
        timestamp: Date.now(),
      });
    }

    // Negative recent performance - increase selectivity
    if (performance.recentPerformance < -0.02) {
      adjustments.push({
        parameter: 'confidenceThreshold',
        oldValue: 0.5,
        newValue: 0.6,
        reason: `Negative recent performance - increasing selectivity`,
        timestamp: Date.now(),
      });
    }

    return adjustments;
  }

  private updateStrategyEvolution(
    strategyId: string,
    performance: StrategyPerformance
  ): void {
    const existing = this.strategyEvolutions.get(strategyId);
    const versions = existing?.versions ?? [];

    // Create new version if significant change
    const shouldCreateVersion =
      versions.length === 0 ||
      Math.abs(
        performance.winRate - versions[versions.length - 1].performance.winRate
      ) > 0.05;

    if (shouldCreateVersion) {
      versions.push({
        version: versions.length + 1,
        parameters: {}, // Would be filled with actual parameters
        performance,
        timestamp: Date.now(),
      });
    }

    // Keep only last 50 versions
    const recentVersions = versions.slice(-50);

    const evolution: StrategyEvolution = {
      strategyId,
      versions: recentVersions,
      currentVersion: recentVersions.length,
    };

    this.strategyEvolutions.set(strategyId, evolution);
  }

  private updateFeatureImportance(outcome: TradeOutcome): void {
    // Simple feature importance update based on outcome
    const wasSuccessful = outcome.pnl > 0;
    const features = outcome.structuralFeaturesAtEntry;

    // Update importance based on which features were prominent in successful trades
    const adjustmentFactor = wasSuccessful ? 0.01 : -0.005;

    // Momentum importance
    if (Math.abs(features.priceHistory.momentum) > 0.01) {
      this.adjustFeatureImportance('momentum', adjustmentFactor);
    }

    // Volatility importance
    if (features.volatilityRegime.impliedVol > 30) {
      this.adjustFeatureImportance('volatility', adjustmentFactor);
    }

    // Gamma importance
    if (features.gammaPull.magnitude > 0.5) {
      this.adjustFeatureImportance('gammaConcentration', adjustmentFactor);
    }

    // Liquidity importance
    if (Math.abs(features.liquidityMap.imbalance) > 0.2) {
      this.adjustFeatureImportance('liquidityImbalance', adjustmentFactor);
    }

    // Dealer flow importance
    if (features.dealerPositioning.confidence > 0.5) {
      this.adjustFeatureImportance('dealerFlow', adjustmentFactor);
    }

    // Normalize importance weights
    this.normalizeFeatureImportance();
  }

  private adjustFeatureImportance(feature: string, adjustment: number): void {
    const current = this.featureImportance.get(feature) ?? 0.1;
    this.featureImportance.set(feature, Math.max(0.01, current + adjustment));
  }

  private normalizeFeatureImportance(): void {
    const total = Array.from(this.featureImportance.values()).reduce(
      (sum, v) => sum + v,
      0
    );

    if (total > 0) {
      for (const [key, value] of this.featureImportance) {
        this.featureImportance.set(key, value / total);
      }
    }
  }

  getTradeOutcomes(strategyId?: string): TradeOutcome[] {
    const outcomes = this.tradeOutcomes.toArray();
    if (strategyId) {
      return outcomes.filter((o) => o.strategyId === strategyId);
    }
    return outcomes;
  }

  getLearningProgress(strategyId: string): LearningProgress | undefined {
    return this.learningProgress.get(strategyId);
  }

  getAllLearningProgress(): LearningProgress[] {
    return Array.from(this.learningProgress.values());
  }

  getStrategyEvolution(strategyId: string): StrategyEvolution | undefined {
    return this.strategyEvolutions.get(strategyId);
  }

  getAllStrategyEvolutions(): StrategyEvolution[] {
    return Array.from(this.strategyEvolutions.values());
  }

  getFeatureImportance(): Map<string, number> {
    return new Map(this.featureImportance);
  }

  getOverallPerformance(): {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    sharpeRatio: number;
    maxDrawdown: number;
  } {
    const outcomes = this.tradeOutcomes.toArray();

    if (outcomes.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalPnL: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
      };
    }

    const pnls = outcomes.map((o) => o.pnlPercent);
    const wins = outcomes.filter((o) => o.pnl > 0).length;
    const equity = this.calculateEquityCurve(outcomes);

    return {
      totalTrades: outcomes.length,
      winRate: wins / outcomes.length,
      totalPnL: outcomes.reduce((sum, o) => sum + o.pnl, 0),
      sharpeRatio: sharpeRatio(pnls),
      maxDrawdown: maxDrawdown(equity),
    };
  }

  reset(): void {
    this.tradeOutcomes = new CircularBuffer(10000);
    this.learningProgress.clear();
    this.strategyEvolutions.clear();
    this.initializeFeatureImportance();
  }
}

export default LearningEngine;
