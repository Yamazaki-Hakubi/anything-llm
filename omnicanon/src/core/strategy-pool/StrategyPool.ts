/**
 * Strategy Pool
 * Template matching and signal generation
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  StructuralFeatures,
  Regime,
  CoherenceScore,
  StrategyTemplate,
  ActiveStrategy,
  StrategyPerformance,
  Signal,
  SignalDirection,
  StrategyType,
  RegimeType,
} from '../types';
import { clamp, mean, sigmoid } from '../../utils/math';

export class StrategyPool {
  private templates: Map<string, StrategyTemplate> = new Map();
  private activeStrategies: Map<string, ActiveStrategy> = new Map();
  private performanceHistory: Map<string, StrategyPerformance[]> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    const defaultTemplates: StrategyTemplate[] = [
      {
        id: 'gamma_scalp_v1',
        name: 'Gamma Scalp',
        type: 'gamma_scalp',
        description: 'Scalp around gamma flip levels exploiting dealer hedging',
        validRegimes: ['range_bound', 'low_volatility', 'consolidation'],
        activationThreshold: 0.6,
        parameters: {
          minGammaConcentration: 0.3,
          maxHoldingPeriod: 30,
          targetProfit: 0.005,
          stopLoss: 0.003,
        },
        expectedWinRate: 0.55,
        expectedRiskReward: 1.5,
        timeframe: 5,
      },
      {
        id: 'momentum_follow_v1',
        name: 'Momentum Follow',
        type: 'momentum_follow',
        description: 'Follow strong momentum with trend confirmation',
        validRegimes: ['trending_bullish', 'trending_bearish', 'breakout', 'breakdown'],
        activationThreshold: 0.65,
        parameters: {
          minMomentum: 0.015,
          minTrendStrength: 0.5,
          trailingStop: 0.02,
          targetMultiple: 2.5,
        },
        expectedWinRate: 0.45,
        expectedRiskReward: 2.5,
        timeframe: 15,
      },
      {
        id: 'mean_reversion_v1',
        name: 'Mean Reversion',
        type: 'mean_reversion',
        description: 'Fade extreme moves back to mean',
        validRegimes: ['mean_reversion', 'range_bound', 'high_volatility'],
        activationThreshold: 0.7,
        parameters: {
          minDeviation: 2.0,
          maxDeviation: 4.0,
          targetReversion: 0.5,
          stopLossMultiple: 1.5,
        },
        expectedWinRate: 0.6,
        expectedRiskReward: 1.2,
        timeframe: 60,
      },
      {
        id: 'volatility_expansion_v1',
        name: 'Volatility Expansion',
        type: 'volatility_expansion',
        description: 'Capture moves when volatility expands',
        validRegimes: ['breakout', 'breakdown', 'high_volatility'],
        activationThreshold: 0.65,
        parameters: {
          minVolExpansion: 1.5,
          momentumThreshold: 0.01,
          maxHoldingPeriod: 240,
          riskPerTrade: 0.02,
        },
        expectedWinRate: 0.4,
        expectedRiskReward: 3.0,
        timeframe: 60,
      },
      {
        id: 'volatility_contraction_v1',
        name: 'Volatility Contraction',
        type: 'volatility_contraction',
        description: 'Position for expansion during low volatility',
        validRegimes: ['low_volatility', 'consolidation'],
        activationThreshold: 0.6,
        parameters: {
          maxImpliedVol: 0.2,
          minContraction: 0.3,
          straddleWidth: 0.05,
          maxDaysToExpiry: 30,
        },
        expectedWinRate: 0.5,
        expectedRiskReward: 2.0,
        timeframe: 240,
      },
      {
        id: 'liquidity_hunt_v1',
        name: 'Liquidity Hunt',
        type: 'liquidity_hunt',
        description: 'Anticipate moves to capture liquidity pockets',
        validRegimes: ['range_bound', 'consolidation', 'mean_reversion'],
        activationThreshold: 0.7,
        parameters: {
          minLiquidityPocket: 1000000,
          proximityThreshold: 0.01,
          expectedBounce: 0.005,
          stopBeyondPocket: 0.003,
        },
        expectedWinRate: 0.55,
        expectedRiskReward: 1.8,
        timeframe: 15,
      },
      {
        id: 'flow_alignment_v1',
        name: 'Flow Alignment',
        type: 'flow_alignment',
        description: 'Align with dealer hedging flows',
        validRegimes: ['trending_bullish', 'trending_bearish', 'gamma_squeeze'],
        activationThreshold: 0.65,
        parameters: {
          minFlowStrength: 0.4,
          gammaThreshold: 500000,
          followDistance: 0.002,
          exitOnFlowReversal: true,
        },
        expectedWinRate: 0.5,
        expectedRiskReward: 2.0,
        timeframe: 30,
      },
      {
        id: 'structural_break_v1',
        name: 'Structural Break',
        type: 'structural_break',
        description: 'Trade structural level breaks',
        validRegimes: ['breakout', 'breakdown'],
        activationThreshold: 0.75,
        parameters: {
          minBreakStrength: 0.7,
          confirmationBars: 3,
          retestEntry: true,
          targetExtension: 1.618,
        },
        expectedWinRate: 0.4,
        expectedRiskReward: 3.5,
        timeframe: 60,
      },
      {
        id: 'pattern_recognition_v1',
        name: 'Pattern Recognition',
        type: 'pattern_recognition',
        description: 'Trade recognized chart patterns',
        validRegimes: ['range_bound', 'consolidation', 'trending_bullish', 'trending_bearish'],
        activationThreshold: 0.7,
        parameters: {
          minPatternScore: 0.7,
          patternTypes: ['double_bottom', 'double_top', 'head_shoulders', 'triangle'],
          confirmationVolume: 1.5,
          targetMeasuredMove: true,
        },
        expectedWinRate: 0.5,
        expectedRiskReward: 2.0,
        timeframe: 60,
      },
      {
        id: 'fractal_resonance_v1',
        name: 'Fractal Resonance',
        type: 'fractal_resonance',
        description: 'Trade when multiple timeframes align',
        validRegimes: ['trending_bullish', 'trending_bearish', 'breakout', 'breakdown'],
        activationThreshold: 0.8,
        parameters: {
          minTimeframeAlignment: 3,
          timeframes: [5, 15, 60, 240],
          resonanceThreshold: 0.7,
          pyramidOnStrength: true,
        },
        expectedWinRate: 0.55,
        expectedRiskReward: 2.5,
        timeframe: 15,
      },
    ];

    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
      this.performanceHistory.set(template.id, []);
    }
  }

  activateStrategies(
    structuralFeatures: StructuralFeatures,
    regime: Regime,
    coherence: CoherenceScore
  ): ActiveStrategy[] {
    const active: ActiveStrategy[] = [];

    for (const template of this.templates.values()) {
      // Check if strategy is valid for current regime
      if (!template.validRegimes.includes(regime.type)) {
        continue;
      }

      // Calculate activation score
      const activationScore = this.calculateActivationScore(
        template,
        structuralFeatures,
        regime,
        coherence
      );

      // Apply confidence threshold
      if (activationScore >= template.activationThreshold) {
        const performance = this.getLatestPerformance(template.id);

        const activeStrategy: ActiveStrategy = {
          template,
          activationScore,
          parameters: this.adaptParameters(template, regime),
          context: {
            structuralFeatures,
            regime,
            coherence,
          },
          currentSignal: null,
          performance,
          isActive: true,
        };

        // Generate signal for this strategy
        activeStrategy.currentSignal = this.generateSignal(
          activeStrategy,
          structuralFeatures
        );

        active.push(activeStrategy);
        this.activeStrategies.set(template.id, activeStrategy);
      }
    }

    // Sort by activation score
    active.sort((a, b) => b.activationScore - a.activationScore);

    // Limit number of active strategies based on coherence
    const maxActive = Math.min(10, Math.floor(coherence.confidence * 20));

    return active.slice(0, maxActive);
  }

  private calculateActivationScore(
    template: StrategyTemplate,
    structuralFeatures: StructuralFeatures,
    regime: Regime,
    coherence: CoherenceScore
  ): number {
    let score = 0;

    // Base score from regime match
    score += regime.confidence * 0.3;

    // Coherence contribution
    score += coherence.total * 0.2;

    // Strategy-specific conditions
    switch (template.type) {
      case 'gamma_scalp':
        score += this.scoreGammaScalp(template, structuralFeatures);
        break;
      case 'momentum_follow':
        score += this.scoreMomentumFollow(template, structuralFeatures);
        break;
      case 'mean_reversion':
        score += this.scoreMeanReversion(template, structuralFeatures);
        break;
      case 'volatility_expansion':
        score += this.scoreVolatilityExpansion(template, structuralFeatures);
        break;
      case 'volatility_contraction':
        score += this.scoreVolatilityContraction(template, structuralFeatures);
        break;
      case 'liquidity_hunt':
        score += this.scoreLiquidityHunt(template, structuralFeatures);
        break;
      case 'flow_alignment':
        score += this.scoreFlowAlignment(template, structuralFeatures);
        break;
      case 'structural_break':
        score += this.scoreStructuralBreak(template, structuralFeatures);
        break;
      case 'pattern_recognition':
        score += this.scorePatternRecognition(template, structuralFeatures);
        break;
      case 'fractal_resonance':
        score += this.scoreFractalResonance(template, structuralFeatures, coherence);
        break;
    }

    // Recent performance adjustment
    const performance = this.getLatestPerformance(template.id);
    score += performance.recentPerformance * 0.1;

    return clamp(score, 0, 1);
  }

  private scoreGammaScalp(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    const { gammaPull, gammaFlips } = features;
    let score = 0;

    // Strong gamma concentration nearby
    if (gammaPull.magnitude > template.parameters.minGammaConcentration) {
      score += 0.3;
    }

    // Gamma flip level nearby (within 1%)
    const latestPrice = features.priceHistory.prices[features.priceHistory.prices.length - 1] ?? 0;
    const nearbyFlip = gammaFlips.find(
      (f) => Math.abs(f.price - latestPrice) / latestPrice < 0.01
    );
    if (nearbyFlip) {
      score += 0.2;
    }

    return score;
  }

  private scoreMomentumFollow(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    const { priceHistory } = features;
    let score = 0;

    if (Math.abs(priceHistory.momentum) > template.parameters.minMomentum) {
      score += 0.25;
    }

    if (priceHistory.trendStrength > template.parameters.minTrendStrength) {
      score += 0.25;
    }

    return score;
  }

  private scoreMeanReversion(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    const { priceHistory, volatilityRegime } = features;
    let score = 0;

    // High volatility but low momentum = mean reversion setup
    if (volatilityRegime.impliedVol > 25 && Math.abs(priceHistory.momentum) < 0.01) {
      score += 0.3;
    }

    // Price away from mean
    if (priceHistory.trendStrength > 0.6) {
      score += 0.2;
    }

    return score;
  }

  private scoreVolatilityExpansion(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    const { volatilityRegime } = features;
    let score = 0;

    // IV expanding vs HV
    if (volatilityRegime.volSpread > 5) {
      score += 0.25;
    }

    // Vol of vol high
    if (volatilityRegime.volOfVol > 0.2) {
      score += 0.25;
    }

    return score;
  }

  private scoreVolatilityContraction(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    const { volatilityRegime } = features;
    let score = 0;

    // Low IV
    if (volatilityRegime.impliedVol < template.parameters.maxImpliedVol * 100) {
      score += 0.3;
    }

    // IV below HV
    if (volatilityRegime.volSpread < 0) {
      score += 0.2;
    }

    return score;
  }

  private scoreLiquidityHunt(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    const { liquidityMap, priceHistory } = features;
    let score = 0;

    // Strong liquidity imbalance
    if (Math.abs(liquidityMap.imbalance) > 0.3) {
      score += 0.25;
    }

    // Price approaching liquidity pocket
    const latestPrice = priceHistory.prices[priceHistory.prices.length - 1] ?? 0;
    const nearbyLiquidity = liquidityMap.levels.find(
      (l) =>
        l.volume > template.parameters.minLiquidityPocket &&
        Math.abs(l.price - latestPrice) / latestPrice < template.parameters.proximityThreshold
    );
    if (nearbyLiquidity) {
      score += 0.25;
    }

    return score;
  }

  private scoreFlowAlignment(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    const { dealerPositioning, gammaSurface } = features;
    let score = 0;

    // Strong dealer hedging flow
    if (Math.abs(dealerPositioning.hedgingPressure) > template.parameters.minFlowStrength) {
      score += 0.25;
    }

    // Significant gamma exposure
    if (Math.abs(gammaSurface.netGamma) > template.parameters.gammaThreshold) {
      score += 0.25;
    }

    return score;
  }

  private scoreStructuralBreak(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    const { priceHistory, volatilityRegime } = features;
    let score = 0;

    // Strong trend
    if (priceHistory.trendStrength > template.parameters.minBreakStrength) {
      score += 0.25;
    }

    // Volatility expanding
    if (volatilityRegime.volOfVol > 0.2) {
      score += 0.25;
    }

    return score;
  }

  private scorePatternRecognition(
    template: StrategyTemplate,
    features: StructuralFeatures
  ): number {
    // Placeholder for pattern recognition scoring
    // Would use actual pattern detection algorithms
    return 0.25;
  }

  private scoreFractalResonance(
    template: StrategyTemplate,
    features: StructuralFeatures,
    coherence: CoherenceScore
  ): number {
    let score = 0;

    // Temporal coherence high = timeframe alignment
    if (coherence.temporal > template.parameters.resonanceThreshold) {
      score += 0.3;
    }

    // Fractal similarity high
    if (coherence.fractal > template.parameters.resonanceThreshold) {
      score += 0.2;
    }

    return score;
  }

  private adaptParameters(
    template: StrategyTemplate,
    regime: Regime
  ): Record<string, number> {
    const params = { ...template.parameters };

    // Adjust based on volatility
    const volMultiplier =
      regime.characteristics.volatility === 'high' ||
      regime.characteristics.volatility === 'extreme'
        ? 1.5
        : regime.characteristics.volatility === 'low'
        ? 0.7
        : 1.0;

    // Widen stops in high vol
    if (params.stopLoss) {
      params.stopLoss *= volMultiplier;
    }
    if (params.trailingStop) {
      params.trailingStop *= volMultiplier;
    }

    // Adjust targets
    if (params.targetProfit) {
      params.targetProfit *= volMultiplier;
    }

    return params;
  }

  private generateSignal(
    strategy: ActiveStrategy,
    features: StructuralFeatures
  ): Signal | null {
    const { template, parameters, context } = strategy;
    const latestPrice =
      features.priceHistory.prices[features.priceHistory.prices.length - 1] ?? 0;

    if (latestPrice === 0) return null;

    let direction: SignalDirection = 'neutral';
    let strength = 0;
    let stopLoss = 0;
    let targets: number[] = [];

    switch (template.type) {
      case 'gamma_scalp': {
        const { gammaPull } = features;
        if (gammaPull.direction > 0 && gammaPull.magnitude > 0.3) {
          direction = 'long';
          strength = gammaPull.magnitude;
          stopLoss = latestPrice * (1 - (parameters.stopLoss ?? 0.003));
          targets = [latestPrice * (1 + (parameters.targetProfit ?? 0.005))];
        } else if (gammaPull.direction < 0 && gammaPull.magnitude > 0.3) {
          direction = 'short';
          strength = gammaPull.magnitude;
          stopLoss = latestPrice * (1 + (parameters.stopLoss ?? 0.003));
          targets = [latestPrice * (1 - (parameters.targetProfit ?? 0.005))];
        }
        break;
      }

      case 'momentum_follow': {
        const { priceHistory } = features;
        if (priceHistory.momentum > (parameters.minMomentum ?? 0.015)) {
          direction = 'long';
          strength = Math.min(priceHistory.momentum * 20, 1);
          stopLoss = latestPrice * (1 - (parameters.trailingStop ?? 0.02));
          const targetDist = (parameters.targetMultiple ?? 2.5) * (parameters.trailingStop ?? 0.02);
          targets = [latestPrice * (1 + targetDist)];
        } else if (priceHistory.momentum < -(parameters.minMomentum ?? 0.015)) {
          direction = 'short';
          strength = Math.min(-priceHistory.momentum * 20, 1);
          stopLoss = latestPrice * (1 + (parameters.trailingStop ?? 0.02));
          const targetDist = (parameters.targetMultiple ?? 2.5) * (parameters.trailingStop ?? 0.02);
          targets = [latestPrice * (1 - targetDist)];
        }
        break;
      }

      case 'mean_reversion': {
        const { priceHistory } = features;
        // Simplified mean reversion logic
        if (priceHistory.trendStrength > 0.6) {
          direction = priceHistory.trend === 'up' ? 'short' : 'long';
          strength = priceHistory.trendStrength * 0.8;
          const stopMult = parameters.stopLossMultiple ?? 1.5;
          if (direction === 'long') {
            stopLoss = latestPrice * (1 - 0.02 * stopMult);
            targets = [latestPrice * 1.01, latestPrice * 1.02];
          } else {
            stopLoss = latestPrice * (1 + 0.02 * stopMult);
            targets = [latestPrice * 0.99, latestPrice * 0.98];
          }
        }
        break;
      }

      case 'flow_alignment': {
        const { dealerPositioning, priceHistory } = features;
        if (dealerPositioning.flowDirection === 'buying' && dealerPositioning.confidence > 0.5) {
          direction = 'long';
          strength = dealerPositioning.confidence;
          stopLoss = latestPrice * 0.98;
          targets = [latestPrice * 1.02, latestPrice * 1.04];
        } else if (dealerPositioning.flowDirection === 'selling' && dealerPositioning.confidence > 0.5) {
          direction = 'short';
          strength = dealerPositioning.confidence;
          stopLoss = latestPrice * 1.02;
          targets = [latestPrice * 0.98, latestPrice * 0.96];
        }
        break;
      }

      default:
        // Generic signal based on regime and trend
        const { regime } = context;
        if (regime.characteristics.trend === 'up' && regime.confidence > 0.6) {
          direction = 'long';
          strength = regime.confidence * 0.7;
          stopLoss = latestPrice * 0.97;
          targets = [latestPrice * 1.02];
        } else if (regime.characteristics.trend === 'down' && regime.confidence > 0.6) {
          direction = 'short';
          strength = regime.confidence * 0.7;
          stopLoss = latestPrice * 1.03;
          targets = [latestPrice * 0.98];
        }
    }

    if (direction === 'neutral' || strength < 0.3) {
      return null;
    }

    return {
      id: uuidv4(),
      strategyId: template.id,
      timestamp: Date.now(),
      direction,
      strength,
      confidence: strategy.activationScore,
      entryPrice: latestPrice,
      stopLoss,
      targets,
      timeframe: template.timeframe,
      rationale: `${template.name} signal: ${direction} with strength ${strength.toFixed(2)}`,
      structuralContext: {
        gammaLevel: features.gammaSurface.netGamma,
        liquiditySupport: features.liquidityMap.depth,
        volatilityState: features.volatilityRegime.regime,
        dealerFlow: features.dealerPositioning.flowDirection,
      },
    };
  }

  private getLatestPerformance(strategyId: string): StrategyPerformance {
    const history = this.performanceHistory.get(strategyId) ?? [];
    if (history.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0.5,
        profitFactor: 1,
        sharpeRatio: 0,
        maxDrawdown: 0,
        recentPerformance: 0,
        adaptationScore: 0.5,
      };
    }
    return history[history.length - 1];
  }

  updatePerformance(strategyId: string, performance: StrategyPerformance): void {
    const history = this.performanceHistory.get(strategyId) ?? [];
    history.push(performance);
    if (history.length > 100) {
      history.shift();
    }
    this.performanceHistory.set(strategyId, history);
  }

  getTemplate(id: string): StrategyTemplate | undefined {
    return this.templates.get(id);
  }

  getAllTemplates(): StrategyTemplate[] {
    return Array.from(this.templates.values());
  }

  getActiveStrategies(): ActiveStrategy[] {
    return Array.from(this.activeStrategies.values());
  }

  addTemplate(template: StrategyTemplate): void {
    this.templates.set(template.id, template);
    this.performanceHistory.set(template.id, []);
  }

  removeTemplate(id: string): void {
    this.templates.delete(id);
    this.activeStrategies.delete(id);
    this.performanceHistory.delete(id);
  }
}

export default StrategyPool;
