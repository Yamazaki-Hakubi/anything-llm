/**
 * Meta-Controller
 * Regime classification and coherence calculation
 */

import type {
  StructuralFeatures,
  Regime,
  RegimeType,
  CoherenceScore,
  ActiveStrategy,
  VolatilityRegime,
} from '../types';
import {
  mean,
  standardDeviation,
  correlation,
  sigmoid,
  clamp,
  cosineSimilarity,
} from '../../utils/math';
import { CircularBuffer } from '../../utils/circularBuffer';

interface RegimeHistory {
  regime: Regime;
  timestamp: number;
  features: number[];
}

export class MetaController {
  private regimeHistory: CircularBuffer<RegimeHistory>;
  private coherenceHistory: CircularBuffer<number>;
  private featureHistory: Map<string, CircularBuffer<number>>;

  constructor() {
    this.regimeHistory = new CircularBuffer(100);
    this.coherenceHistory = new CircularBuffer(100);
    this.featureHistory = new Map();

    // Initialize feature buffers
    const featureNames = [
      'momentum',
      'volatility',
      'gamma',
      'liquidity',
      'trend',
    ];
    for (const name of featureNames) {
      this.featureHistory.set(name, new CircularBuffer(100));
    }
  }

  classifyRegime(structuralFeatures: StructuralFeatures): Regime {
    // Extract key features for classification
    const features = this.extractRegimeFeatures(structuralFeatures);

    // Update feature history
    this.updateFeatureHistory(features);

    // Classify using rule-based + statistical approach
    const regimeType = this.determineRegimeType(features, structuralFeatures);

    // Calculate confidence
    const confidence = this.calculateRegimeConfidence(features, regimeType);

    // Calculate duration (how long we've been in similar regime)
    const duration = this.calculateRegimeDuration(regimeType);

    // Calculate transition probability
    const transitionProbability = this.calculateTransitionProbability(
      regimeType,
      features
    );

    const regime: Regime = {
      type: regimeType,
      confidence,
      duration,
      transitionProbability,
      characteristics: {
        volatility: structuralFeatures.volatilityRegime.regime,
        trend: structuralFeatures.priceHistory.trend,
        momentum: structuralFeatures.priceHistory.momentum,
        marketPhase: this.determineMarketPhase(features, structuralFeatures),
      },
    };

    // Store in history
    this.regimeHistory.add({
      regime,
      timestamp: Date.now(),
      features: Object.values(features),
    });

    return regime;
  }

  calculateCoherence(
    structuralFeatures: StructuralFeatures,
    regime: Regime,
    activeStrategies: ActiveStrategy[] = []
  ): CoherenceScore {
    // 1. Structural self-consistency
    const structural = this.calculateStructuralConsistency(structuralFeatures);

    // 2. Regime-strategy alignment
    const regimeAlignment = this.calculateRegimeAlignment(
      regime,
      activeStrategies
    );

    // 3. Multi-timeframe consistency
    const temporal = this.calculateTemporalConsistency(structuralFeatures);

    // 4. Fractal similarity to historical patterns
    const fractal = this.calculateFractalSimilarity(structuralFeatures);

    // 5. Signal convergence
    const convergence = this.calculateSignalConvergence(activeStrategies);

    // Combined score (weighted)
    const total =
      0.3 * structural +
      0.25 * regimeAlignment +
      0.2 * temporal +
      0.15 * fractal +
      0.1 * convergence;

    const confidence = sigmoid(total * 2 - 1);

    const coherence: CoherenceScore = {
      total,
      confidence,
      structural,
      regime: regimeAlignment,
      temporal,
      fractal,
      convergence,
      components: {
        marketSystemAlignment: (structural + regimeAlignment) / 2,
        signalConsistency: convergence,
        timeframeHarmony: temporal,
        patternRecognition: fractal,
      },
    };

    this.coherenceHistory.add(total);

    return coherence;
  }

  private extractRegimeFeatures(
    structuralFeatures: StructuralFeatures
  ): Record<string, number> {
    const { priceHistory, volatilityRegime, gammaPull, liquidityMap } =
      structuralFeatures;

    return {
      momentum: priceHistory.momentum,
      trendStrength: priceHistory.trendStrength,
      volatility: volatilityRegime.impliedVol / 100,
      volOfVol: volatilityRegime.volOfVol,
      volSpread: volatilityRegime.volSpread / 100,
      skew: volatilityRegime.skew / 100,
      gammaDirection: gammaPull.direction,
      gammaMagnitude: gammaPull.magnitude,
      liquidityImbalance: liquidityMap.imbalance,
      absorptionRate: liquidityMap.absorptionRate,
    };
  }

  private updateFeatureHistory(features: Record<string, number>): void {
    this.featureHistory.get('momentum')?.add(features.momentum);
    this.featureHistory.get('volatility')?.add(features.volatility);
    this.featureHistory.get('gamma')?.add(features.gammaMagnitude);
    this.featureHistory.get('liquidity')?.add(features.liquidityImbalance);
    this.featureHistory.get('trend')?.add(features.trendStrength);
  }

  private determineRegimeType(
    features: Record<string, number>,
    structuralFeatures: StructuralFeatures
  ): RegimeType {
    const { momentum, trendStrength, volatility, volOfVol, gammaMagnitude } =
      features;

    // High volatility regimes
    if (volatility > 0.4) {
      return 'high_volatility';
    }

    // Low volatility regimes
    if (volatility < 0.15) {
      return 'low_volatility';
    }

    // Gamma squeeze detection
    if (
      gammaMagnitude > 0.7 &&
      Math.abs(structuralFeatures.gammaSurface.netGamma) > 1000000
    ) {
      return 'gamma_squeeze';
    }

    // Trending regimes
    if (momentum > 0.02 && trendStrength > 0.6) {
      return 'trending_bullish';
    }

    if (momentum < -0.02 && trendStrength > 0.6) {
      return 'trending_bearish';
    }

    // Breakout/breakdown detection
    const volExpanding = volOfVol > 0.3;
    if (volExpanding && momentum > 0.01) {
      return 'breakout';
    }
    if (volExpanding && momentum < -0.01) {
      return 'breakdown';
    }

    // Mean reversion conditions
    if (Math.abs(momentum) < 0.005 && volatility > 0.2) {
      return 'mean_reversion';
    }

    // Range bound
    if (trendStrength < 0.3 && Math.abs(momentum) < 0.01) {
      return 'range_bound';
    }

    // Consolidation
    if (volatility < 0.2 && trendStrength < 0.4) {
      return 'consolidation';
    }

    return 'range_bound';
  }

  private calculateRegimeConfidence(
    features: Record<string, number>,
    regimeType: RegimeType
  ): number {
    // Confidence based on how well features match the regime
    let confidence = 0.5;

    switch (regimeType) {
      case 'trending_bullish':
        confidence =
          0.5 +
          0.3 * clamp(features.momentum * 10, 0, 1) +
          0.2 * features.trendStrength;
        break;

      case 'trending_bearish':
        confidence =
          0.5 +
          0.3 * clamp(-features.momentum * 10, 0, 1) +
          0.2 * features.trendStrength;
        break;

      case 'high_volatility':
        confidence = 0.5 + 0.5 * clamp(features.volatility - 0.3, 0, 1);
        break;

      case 'low_volatility':
        confidence = 0.5 + 0.5 * clamp(0.2 - features.volatility, 0, 1);
        break;

      case 'gamma_squeeze':
        confidence = 0.5 + 0.5 * features.gammaMagnitude;
        break;

      case 'range_bound':
        confidence =
          0.5 +
          0.3 * (1 - features.trendStrength) +
          0.2 * (1 - Math.abs(features.momentum) * 20);
        break;

      default:
        confidence = 0.5;
    }

    return clamp(confidence, 0, 1);
  }

  private calculateRegimeDuration(regimeType: RegimeType): number {
    const history = this.regimeHistory.toArray();
    let duration = 0;

    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].regime.type === regimeType) {
        duration++;
      } else {
        break;
      }
    }

    return duration;
  }

  private calculateTransitionProbability(
    currentRegime: RegimeType,
    features: Record<string, number>
  ): number {
    // Estimate probability of regime change
    const history = this.regimeHistory.toArray();

    if (history.length < 10) {
      return 0.1; // Default low probability
    }

    // Count transitions in history
    let transitions = 0;
    let sameRegimeCount = 0;

    for (let i = 1; i < history.length; i++) {
      if (history[i].regime.type === currentRegime) {
        sameRegimeCount++;
        if (history[i - 1].regime.type !== currentRegime) {
          transitions++;
        }
      }
    }

    // Base transition probability
    const baseProb = sameRegimeCount > 0 ? transitions / sameRegimeCount : 0.1;

    // Adjust based on volatility of volatility (higher volOfVol = more likely to change)
    const volAdjustment = features.volOfVol * 0.5;

    return clamp(baseProb + volAdjustment, 0, 0.9);
  }

  private determineMarketPhase(
    features: Record<string, number>,
    structuralFeatures: StructuralFeatures
  ): 'accumulation' | 'markup' | 'distribution' | 'markdown' {
    const { momentum, trendStrength, volatility, liquidityImbalance } = features;

    // Wyckoff market phases
    if (momentum > 0.01 && trendStrength > 0.5) {
      return 'markup';
    }

    if (momentum < -0.01 && trendStrength > 0.5) {
      return 'markdown';
    }

    if (liquidityImbalance > 0.2 && Math.abs(momentum) < 0.01) {
      return 'accumulation';
    }

    if (liquidityImbalance < -0.2 && Math.abs(momentum) < 0.01) {
      return 'distribution';
    }

    // Default based on trend
    return momentum >= 0 ? 'accumulation' : 'distribution';
  }

  private calculateStructuralConsistency(
    structuralFeatures: StructuralFeatures
  ): number {
    // Check consistency between different structural elements
    const { gammaPull, liquidityMap, priceHistory, dealerPositioning } =
      structuralFeatures;

    let consistency = 0;
    let checks = 0;

    // Gamma pull vs price trend alignment
    const gammaTrendAlign =
      (gammaPull.direction > 0 && priceHistory.trend === 'up') ||
      (gammaPull.direction < 0 && priceHistory.trend === 'down') ||
      (gammaPull.direction === 0 && priceHistory.trend === 'sideways');
    consistency += gammaTrendAlign ? 1 : 0;
    checks++;

    // Liquidity imbalance vs momentum alignment
    const liquidityMomentumAlign =
      (liquidityMap.imbalance > 0 && priceHistory.momentum > 0) ||
      (liquidityMap.imbalance < 0 && priceHistory.momentum < 0);
    consistency += liquidityMomentumAlign ? 1 : 0.5;
    checks++;

    // Dealer flow vs price direction
    const dealerFlowAlign =
      (dealerPositioning.flowDirection === 'buying' &&
        priceHistory.trend === 'up') ||
      (dealerPositioning.flowDirection === 'selling' &&
        priceHistory.trend === 'down') ||
      dealerPositioning.flowDirection === 'neutral';
    consistency += dealerFlowAlign ? 1 : 0;
    checks++;

    // Hedging pressure vs volatility
    const hedgingVolAlign =
      Math.abs(dealerPositioning.hedgingPressure) > 0.5 ===
      (structuralFeatures.volatilityRegime.regime !== 'low');
    consistency += hedgingVolAlign ? 1 : 0.5;
    checks++;

    return consistency / checks;
  }

  private calculateRegimeAlignment(
    regime: Regime,
    activeStrategies: ActiveStrategy[]
  ): number {
    if (activeStrategies.length === 0) {
      return 0.5; // Neutral when no strategies
    }

    let alignedCount = 0;

    for (const strategy of activeStrategies) {
      if (strategy.template.validRegimes.includes(regime.type)) {
        alignedCount++;
      }
    }

    return alignedCount / activeStrategies.length;
  }

  private calculateTemporalConsistency(
    structuralFeatures: StructuralFeatures
  ): number {
    // Check if features are consistent across recent history
    const momentumHistory = this.featureHistory.get('momentum')?.toArray() ?? [];
    const volatilityHistory =
      this.featureHistory.get('volatility')?.toArray() ?? [];

    if (momentumHistory.length < 5) {
      return 0.5;
    }

    // Calculate autocorrelation
    const recentMomentum = momentumHistory.slice(-20);
    const momentumStd = standardDeviation(recentMomentum);

    // Low std = consistent = high temporal coherence
    const momentumConsistency = 1 - clamp(momentumStd * 10, 0, 1);

    const recentVol = volatilityHistory.slice(-20);
    const volStd = standardDeviation(recentVol);
    const volConsistency = 1 - clamp(volStd * 5, 0, 1);

    return (momentumConsistency + volConsistency) / 2;
  }

  private calculateFractalSimilarity(
    structuralFeatures: StructuralFeatures
  ): number {
    // Compare current feature vector to historical patterns
    const history = this.regimeHistory.toArray();

    if (history.length < 10) {
      return 0.5;
    }

    const currentFeatures = Object.values(
      this.extractRegimeFeatures(structuralFeatures)
    );

    // Find most similar historical pattern
    let maxSimilarity = 0;

    for (const historical of history.slice(-50)) {
      const similarity = cosineSimilarity(currentFeatures, historical.features);
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }
    }

    return maxSimilarity;
  }

  private calculateSignalConvergence(activeStrategies: ActiveStrategy[]): number {
    if (activeStrategies.length < 2) {
      return 0.5;
    }

    const signals = activeStrategies
      .filter((s) => s.currentSignal !== null)
      .map((s) => s.currentSignal!);

    if (signals.length < 2) {
      return 0.5;
    }

    // Check if signals agree on direction
    const longCount = signals.filter((s) => s.direction === 'long').length;
    const shortCount = signals.filter((s) => s.direction === 'short').length;
    const neutralCount = signals.filter((s) => s.direction === 'neutral').length;

    const maxCount = Math.max(longCount, shortCount, neutralCount);
    const convergence = maxCount / signals.length;

    return convergence;
  }

  getRegimeHistory(): RegimeHistory[] {
    return this.regimeHistory.toArray();
  }

  getCoherenceHistory(): number[] {
    return this.coherenceHistory.toArray();
  }

  getAverageCoherence(): number {
    return this.coherenceHistory.average();
  }
}

export default MetaController;
