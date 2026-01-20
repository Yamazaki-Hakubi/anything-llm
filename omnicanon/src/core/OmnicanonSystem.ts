/**
 * OMNICANON System
 * Main orchestrator implementing the root function
 */

import type {
  MarketData,
  SystemState,
  StructuralFeatures,
  Regime,
  CoherenceScore,
  ActiveStrategy,
  Signal,
  ApprovedSignal,
  ExecutionResult,
  Portfolio,
  VisualizationData,
} from './types';

import { PerceptionMatrix } from './perception';
import { MetaController } from './meta-controller';
import { StrategyPool } from './strategy-pool';
import { RiskGovernance } from './risk-governance';
import { ExecutionEngine } from './execution';
import { LearningEngine } from './learning';
import { FractalMemory } from './memory';

interface OmnicanonConfig {
  maxStrategies?: number;
  riskLimits?: {
    maxPositionSize?: number;
    maxPortfolioRisk?: number;
    maxDrawdown?: number;
  };
  learningEnabled?: boolean;
}

export class OmnicanonSystem {
  private perceptionMatrix: PerceptionMatrix;
  private metaController: MetaController;
  private strategyPool: StrategyPool;
  private riskGovernance: RiskGovernance;
  private executionEngine: ExecutionEngine;
  private learningEngine: LearningEngine;
  private fractalMemory: FractalMemory;

  private portfolio: Portfolio;
  private lastState: SystemState | null = null;
  private config: OmnicanonConfig;

  constructor(config: OmnicanonConfig = {}) {
    this.config = {
      maxStrategies: 10,
      learningEnabled: true,
      ...config,
    };

    // Initialize all components
    this.perceptionMatrix = new PerceptionMatrix();
    this.metaController = new MetaController();
    this.strategyPool = new StrategyPool();
    this.riskGovernance = new RiskGovernance(config.riskLimits);
    this.executionEngine = new ExecutionEngine();
    this.learningEngine = new LearningEngine();
    this.fractalMemory = new FractalMemory();

    // Initialize portfolio
    this.portfolio = this.initializePortfolio();
  }

  private initializePortfolio(): Portfolio {
    return {
      positions: [],
      totalValue: 100000, // Starting capital
      cashBalance: 100000,
      marginUsed: 0,
      marginAvailable: 50000, // 50% margin available
      unrealizedPnL: 0,
      realizedPnL: 0,
      dailyPnL: 0,
      maxDrawdown: 0,
      currentDrawdown: 0,
    };
  }

  /**
   * Root Function - Main processing loop
   * Called on each market tick
   */
  async rootFunction(rawData: MarketData): Promise<SystemState> {
    const startTime = performance.now();

    // PHASE 1: PERCEPTION (Data -> Structure)
    const structuralFeatures = this.perceptionMatrix.process(rawData);

    // PHASE 2: RESONANCE (Structure -> Coherence)
    const regime = this.metaController.classifyRegime(structuralFeatures);

    // Get active strategies before calculating coherence
    const preliminaryStrategies = this.strategyPool.activateStrategies(
      structuralFeatures,
      regime,
      { total: 0.5, confidence: 0.5, structural: 0.5, regime: 0.5, temporal: 0.5, fractal: 0.5, convergence: 0.5, components: { marketSystemAlignment: 0.5, signalConsistency: 0.5, timeframeHarmony: 0.5, patternRecognition: 0.5 } }
    );

    const coherenceScore = this.metaController.calculateCoherence(
      structuralFeatures,
      regime,
      preliminaryStrategies
    );

    // PHASE 3: HYPOTHESIS GENERATION (Coherence -> Strategies)
    const activeStrategies = this.strategyPool.activateStrategies(
      structuralFeatures,
      regime,
      coherenceScore
    );

    // PHASE 4: SIGNAL GENERATION (Strategies -> Signals)
    const signals = this.generateSignals(activeStrategies, structuralFeatures);

    // PHASE 5: RISK FILTERING (Signals -> Approved Actions)
    const filteredSignals = this.riskGovernance.filterSignals(
      signals,
      this.portfolio,
      structuralFeatures
    );

    // PHASE 6: EXECUTION (Actions -> Market Impact)
    const executionResults = await this.executionEngine.execute(
      filteredSignals,
      structuralFeatures
    );

    // Update portfolio based on execution
    this.updatePortfolio(executionResults);

    // PHASE 7: LEARNING (Outcome -> Wisdom)
    if (this.config.learningEnabled) {
      this.learnFromOutcome(executionResults, structuralFeatures);
    }

    // PHASE 8: VISUALIZATION PREPARATION
    const visualizationData = this.prepareVisualizationData(
      structuralFeatures,
      regime,
      coherenceScore,
      activeStrategies,
      signals,
      filteredSignals,
      executionResults
    );

    const processingTime = performance.now() - startTime;

    const state: SystemState = {
      structuralFeatures,
      regime,
      coherenceScore,
      activeStrategies,
      signals,
      filteredSignals,
      executionResults,
      visualizationData,
      portfolio: { ...this.portfolio },
      recentTrades: this.learningEngine.getTradeOutcomes().slice(-50),
      learningProgress: this.learningEngine.getAllLearningProgress(),
      strategyEvolution: this.learningEngine.getAllStrategyEvolutions(),
      timestamp: Date.now(),
      systemHealth: {
        dataLatency: rawData.timestamp ? Date.now() - rawData.timestamp : 0,
        processingTime,
        memoryUsage: this.fractalMemory.getStats().totalPatterns,
        errorRate: this.executionEngine.getStats().rejectedOrders /
          (this.executionEngine.getStats().totalOrders || 1),
      },
    };

    this.lastState = state;
    return state;
  }

  private generateSignals(
    activeStrategies: ActiveStrategy[],
    _features: StructuralFeatures
  ): Signal[] {
    return activeStrategies
      .filter((s) => s.currentSignal !== null)
      .map((s) => s.currentSignal!);
  }

  private updatePortfolio(results: ExecutionResult[]): void {
    for (const result of results) {
      if (!result.success) continue;

      const { order } = result;
      const positionValue = order.filledSize * order.avgFillPrice;

      // Update cash and margin
      this.portfolio.cashBalance -= positionValue + order.fees;
      this.portfolio.marginUsed += positionValue * 0.5;
      this.portfolio.marginAvailable -= positionValue * 0.5;

      // Add position
      this.portfolio.positions.push({
        id: order.id,
        symbol: order.symbol,
        side: order.side === 'buy' ? 'long' : 'short',
        size: order.filledSize,
        entryPrice: order.avgFillPrice,
        currentPrice: order.avgFillPrice,
        unrealizedPnL: 0,
        realizedPnL: 0,
        stopLoss: order.price * (order.side === 'buy' ? 0.97 : 1.03),
        takeProfit: [order.price * (order.side === 'buy' ? 1.03 : 0.97)],
        entryTime: Date.now(),
        strategyId: order.signalId,
      });
    }

    // Recalculate total value
    const positionValue = this.portfolio.positions.reduce(
      (sum, p) => sum + p.size * p.currentPrice,
      0
    );
    this.portfolio.totalValue = this.portfolio.cashBalance + positionValue;
  }

  private learnFromOutcome(
    results: ExecutionResult[],
    features: StructuralFeatures
  ): void {
    for (const result of results) {
      if (!result.success) continue;

      // For now, use current features as both entry and exit (simplified)
      // In real system, we'd track features at actual exit
      const signal: Signal = {
        id: result.order.signalId,
        strategyId: result.order.signalId,
        timestamp: Date.now(),
        direction: result.order.side === 'buy' ? 'long' : 'short',
        strength: 0.7,
        confidence: 0.7,
        entryPrice: result.order.avgFillPrice,
        stopLoss: result.order.price * 0.97,
        targets: [result.order.price * 1.03],
        timeframe: 15,
        rationale: 'Simulated signal',
        structuralContext: {
          gammaLevel: features.gammaSurface.netGamma,
          liquiditySupport: features.liquidityMap.depth,
          volatilityState: features.volatilityRegime.regime,
          dealerFlow: features.dealerPositioning.flowDirection,
        },
      };

      const outcome = this.learningEngine.analyzeOutcome(
        result,
        features,
        features,
        signal
      );

      // Store pattern in memory
      this.fractalMemory.storePattern(
        features,
        outcome,
        this.lastState?.regime ?? this.metaController.classifyRegime(features)
      );
    }
  }

  private prepareVisualizationData(
    features: StructuralFeatures,
    regime: Regime,
    coherence: CoherenceScore,
    strategies: ActiveStrategy[],
    signals: Signal[],
    _filteredSignals: ApprovedSignal[],
    _results: ExecutionResult[]
  ): VisualizationData {
    // Prepare gamma surface geometry
    const gammaSurfaceGeometry = this.prepareGammaSurfaceGeometry(features);

    // Prepare liquidity particles
    const liquidityParticles = this.prepareLiquidityParticles(features);

    // Prepare price thread
    const priceThreadPoints = this.preparePriceThread(features);

    // Prepare attention heatmap
    const attentionHeatmap = this.prepareAttentionHeatmap(strategies, signals);

    // Animation parameters based on coherence and volatility
    const animations = {
      pulseFrequency: features.volatilityRegime.impliedVol / 50 + 0.5,
      flowSpeed: Math.abs(features.priceHistory.momentum) * 100 + 1,
      glowIntensity: coherence.total,
    };

    // Coherence waveform data
    const coherenceWaveform = {
      points: this.metaController.getCoherenceHistory().map((c, i) => ({
        x: i,
        y: c,
      })),
      resonanceRings: coherence.total > 0.7 ? [
        {
          x: 0,
          y: 0,
          radius: coherence.total * 50,
          alpha: coherence.confidence,
        },
      ] : [],
    };

    // Regime indicator
    const regimeIndicator = {
      angle: this.getRegimeAngle(regime.type),
      magnitude: regime.confidence,
      color: this.getRegimeColor(regime.type),
    };

    return {
      gammaSurfaceGeometry,
      liquidityParticles,
      priceThreadPoints,
      attentionHeatmap,
      animations,
      coherenceWaveform,
      regimeIndicator,
    };
  }

  private prepareGammaSurfaceGeometry(features: StructuralFeatures): Float32Array {
    const { gammaSurface } = features;
    const vertices: number[] = [];

    for (let e = 0; e < gammaSurface.expiries.length; e++) {
      for (let s = 0; s < gammaSurface.strikes.length; s++) {
        const x = s / gammaSurface.strikes.length;
        const y = e / gammaSurface.expiries.length;
        const z = gammaSurface.values[e][s] / (gammaSurface.maxGamma || 1);

        vertices.push(x, y, z);
      }
    }

    return new Float32Array(vertices);
  }

  private prepareLiquidityParticles(features: StructuralFeatures): Float32Array {
    const particles: number[] = [];
    const { liquidityMap } = features;

    for (const level of liquidityMap.levels.slice(0, 100)) {
      // Create multiple particles per level based on volume
      const particleCount = Math.min(10, Math.floor(level.volume / 1000));

      for (let i = 0; i < particleCount; i++) {
        particles.push(
          Math.random() * 2 - 1, // x
          level.price, // y
          Math.random() * 0.5, // z
          level.side === 'bid' ? 0 : 1, // color indicator
          level.flowRate // size
        );
      }
    }

    return new Float32Array(particles);
  }

  private preparePriceThread(features: StructuralFeatures): Float32Array {
    const points: number[] = [];
    const { priceHistory } = features;

    for (let i = 0; i < priceHistory.prices.length; i++) {
      points.push(
        i / priceHistory.prices.length, // x (time)
        priceHistory.prices[i], // y (price)
        0.1 // z (slight elevation)
      );
    }

    return new Float32Array(points);
  }

  private prepareAttentionHeatmap(
    strategies: ActiveStrategy[],
    signals: Signal[]
  ): number[][] {
    // 10x10 heatmap
    const heatmap: number[][] = Array(10)
      .fill(null)
      .map(() => Array(10).fill(0));

    // Place strategy attention based on their type and activation
    for (const strategy of strategies) {
      const x = Math.floor(Math.random() * 10);
      const y = Math.floor(Math.random() * 10);
      heatmap[y][x] += strategy.activationScore;
    }

    // Boost cells with signals
    for (const signal of signals) {
      const x = Math.floor(signal.strength * 9);
      const y = Math.floor(signal.confidence * 9);
      heatmap[y][x] += 0.5;
    }

    // Normalize
    const max = Math.max(...heatmap.flat());
    if (max > 0) {
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          heatmap[y][x] /= max;
        }
      }
    }

    return heatmap;
  }

  private getRegimeAngle(regimeType: string): number {
    const angles: Record<string, number> = {
      trending_bullish: 45,
      trending_bearish: 225,
      range_bound: 90,
      breakout: 60,
      breakdown: 240,
      consolidation: 0,
      high_volatility: 180,
      low_volatility: 0,
      gamma_squeeze: 135,
      mean_reversion: 270,
    };
    return angles[regimeType] ?? 0;
  }

  private getRegimeColor(regimeType: string): string {
    const colors: Record<string, string> = {
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
    return colors[regimeType] ?? '#ffffff';
  }

  // Public API methods
  getState(): SystemState | null {
    return this.lastState;
  }

  getPortfolio(): Portfolio {
    return { ...this.portfolio };
  }

  getStrategies(): ActiveStrategy[] {
    return this.strategyPool.getActiveStrategies();
  }

  getMemoryStats() {
    return this.fractalMemory.getStats();
  }

  getPerformance() {
    return this.learningEngine.getOverallPerformance();
  }

  getRiskSummary() {
    return this.riskGovernance.getRiskSummary(this.portfolio);
  }

  isKillSwitchActive(): boolean {
    return this.riskGovernance.isKillSwitchActive();
  }

  deactivateKillSwitch(): void {
    this.riskGovernance.deactivateKillSwitch();
  }

  reset(): void {
    this.portfolio = this.initializePortfolio();
    this.learningEngine.reset();
    this.fractalMemory.clear();
    this.executionEngine.resetStats();
    this.lastState = null;
  }
}

export default OmnicanonSystem;
