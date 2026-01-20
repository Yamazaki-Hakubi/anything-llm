/**
 * Fractal Memory System
 * Pattern storage and retrieval with version control
 */

import type {
  StructuralFeatures,
  HistoricalPattern,
  TradeOutcome,
  Regime,
} from '../types';
import { CircularBuffer } from '../../utils/circularBuffer';
import { cosineSimilarity, euclideanDistance, normalize } from '../../utils/math';

interface PatternFingerprint {
  features: number[];
  timestamp: number;
  regime: string;
}

interface MemoryIndex {
  byRegime: Map<string, string[]>; // regime -> pattern IDs
  byOutcome: Map<'positive' | 'negative', string[]>; // outcome -> pattern IDs
  byTimeframe: Map<number, string[]>; // timeframe -> pattern IDs
}

export class FractalMemory {
  private patterns: Map<string, HistoricalPattern> = new Map();
  private fingerprints: Map<string, PatternFingerprint> = new Map();
  private recentPatterns: CircularBuffer<string>; // Recent pattern IDs
  private index: MemoryIndex;
  private maxPatterns: number;

  constructor(maxPatterns = 10000) {
    this.maxPatterns = maxPatterns;
    this.recentPatterns = new CircularBuffer(1000);
    this.index = {
      byRegime: new Map(),
      byOutcome: new Map(),
      byTimeframe: new Map(),
    };
    this.index.byOutcome.set('positive', []);
    this.index.byOutcome.set('negative', []);
  }

  storePattern(
    features: StructuralFeatures,
    outcome: TradeOutcome,
    regime: Regime
  ): string {
    const patternId = this.generatePatternId();
    const fingerprint = this.createFingerprint(features, regime);

    const pattern: HistoricalPattern = {
      id: patternId,
      timestamp: Date.now(),
      structuralFingerprint: fingerprint.features,
      outcome,
      regime,
      similarity: 1, // Self-similarity
    };

    // Store pattern and fingerprint
    this.patterns.set(patternId, pattern);
    this.fingerprints.set(patternId, fingerprint);
    this.recentPatterns.add(patternId);

    // Update indices
    this.updateIndices(patternId, pattern, fingerprint);

    // Cleanup if over capacity
    if (this.patterns.size > this.maxPatterns) {
      this.cleanup();
    }

    return patternId;
  }

  private generatePatternId(): string {
    return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createFingerprint(
    features: StructuralFeatures,
    regime: Regime
  ): PatternFingerprint {
    // Extract key features into a numerical vector
    const featureVector = [
      features.priceHistory.momentum,
      features.priceHistory.trendStrength,
      features.volatilityRegime.impliedVol / 100,
      features.volatilityRegime.volSpread / 100,
      features.volatilityRegime.skew / 100,
      features.gammaPull.direction,
      features.gammaPull.magnitude,
      features.liquidityMap.imbalance,
      features.liquidityMap.absorptionRate,
      features.dealerPositioning.hedgingPressure,
      features.dealerPositioning.confidence,
      regime.confidence,
      regime.transitionProbability,
    ];

    // Normalize the vector
    const normalized = normalize(featureVector);

    return {
      features: normalized,
      timestamp: Date.now(),
      regime: regime.type,
    };
  }

  private updateIndices(
    patternId: string,
    pattern: HistoricalPattern,
    fingerprint: PatternFingerprint
  ): void {
    // Index by regime
    const regimePatterns = this.index.byRegime.get(fingerprint.regime) ?? [];
    regimePatterns.push(patternId);
    this.index.byRegime.set(fingerprint.regime, regimePatterns);

    // Index by outcome
    const outcomeType = pattern.outcome.pnl >= 0 ? 'positive' : 'negative';
    const outcomePatterns = this.index.byOutcome.get(outcomeType) ?? [];
    outcomePatterns.push(patternId);
    this.index.byOutcome.set(outcomeType, outcomePatterns);

    // Index by timeframe (round to nearest hour)
    const timeframe = Math.floor(fingerprint.timestamp / 3600000);
    const timeframePatterns = this.index.byTimeframe.get(timeframe) ?? [];
    timeframePatterns.push(patternId);
    this.index.byTimeframe.set(timeframe, timeframePatterns);
  }

  getSimilarPatterns(
    features: StructuralFeatures,
    regime: Regime,
    limit = 10
  ): HistoricalPattern[] {
    const queryFingerprint = this.createFingerprint(features, regime);
    const similarities: Array<{ pattern: HistoricalPattern; similarity: number }> =
      [];

    // First, check patterns with same regime
    const sameRegimeIds = this.index.byRegime.get(regime.type) ?? [];

    for (const patternId of sameRegimeIds) {
      const storedFingerprint = this.fingerprints.get(patternId);
      const pattern = this.patterns.get(patternId);

      if (storedFingerprint && pattern) {
        const similarity = cosineSimilarity(
          queryFingerprint.features,
          storedFingerprint.features
        );

        similarities.push({
          pattern: { ...pattern, similarity },
          similarity,
        });
      }
    }

    // If not enough, expand search to all patterns
    if (similarities.length < limit) {
      for (const [patternId, storedFingerprint] of this.fingerprints) {
        if (sameRegimeIds.includes(patternId)) continue;

        const pattern = this.patterns.get(patternId);
        if (pattern) {
          const similarity = cosineSimilarity(
            queryFingerprint.features,
            storedFingerprint.features
          );

          similarities.push({
            pattern: { ...pattern, similarity },
            similarity,
          });
        }
      }
    }

    // Sort by similarity and return top N
    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities.slice(0, limit).map((s) => s.pattern);
  }

  getPatternsByOutcome(positive: boolean, limit = 50): HistoricalPattern[] {
    const outcomeType = positive ? 'positive' : 'negative';
    const patternIds = this.index.byOutcome.get(outcomeType) ?? [];

    return patternIds
      .slice(-limit)
      .map((id) => this.patterns.get(id))
      .filter((p): p is HistoricalPattern => p !== undefined);
  }

  getPatternsByRegime(regimeType: string, limit = 50): HistoricalPattern[] {
    const patternIds = this.index.byRegime.get(regimeType) ?? [];

    return patternIds
      .slice(-limit)
      .map((id) => this.patterns.get(id))
      .filter((p): p is HistoricalPattern => p !== undefined);
  }

  getRecentPatterns(limit = 20): HistoricalPattern[] {
    const recentIds = this.recentPatterns.getRecent(limit);

    return recentIds
      .map((id) => this.patterns.get(id))
      .filter((p): p is HistoricalPattern => p !== undefined);
  }

  calculateAverageOutcome(similarPatterns: HistoricalPattern[]): {
    avgPnl: number;
    winRate: number;
    avgHoldingPeriod: number;
  } {
    if (similarPatterns.length === 0) {
      return { avgPnl: 0, winRate: 0, avgHoldingPeriod: 0 };
    }

    const pnls = similarPatterns.map((p) => p.outcome.pnlPercent);
    const wins = similarPatterns.filter((p) => p.outcome.pnl > 0).length;
    const holdingPeriods = similarPatterns.map((p) => p.outcome.holdingPeriod);

    return {
      avgPnl: pnls.reduce((a, b) => a + b, 0) / pnls.length,
      winRate: wins / similarPatterns.length,
      avgHoldingPeriod:
        holdingPeriods.reduce((a, b) => a + b, 0) / holdingPeriods.length,
    };
  }

  private cleanup(): void {
    // Remove oldest patterns beyond capacity
    const sortedPatterns = Array.from(this.patterns.entries()).sort(
      ([, a], [, b]) => a.timestamp - b.timestamp
    );

    const toRemove = sortedPatterns.slice(
      0,
      this.patterns.size - this.maxPatterns
    );

    for (const [patternId] of toRemove) {
      this.removePattern(patternId);
    }
  }

  private removePattern(patternId: string): void {
    const pattern = this.patterns.get(patternId);
    const fingerprint = this.fingerprints.get(patternId);

    if (!pattern || !fingerprint) return;

    // Remove from pattern store
    this.patterns.delete(patternId);
    this.fingerprints.delete(patternId);

    // Remove from indices
    const regimePatterns = this.index.byRegime.get(fingerprint.regime);
    if (regimePatterns) {
      const idx = regimePatterns.indexOf(patternId);
      if (idx > -1) regimePatterns.splice(idx, 1);
    }

    const outcomeType = pattern.outcome.pnl >= 0 ? 'positive' : 'negative';
    const outcomePatterns = this.index.byOutcome.get(outcomeType);
    if (outcomePatterns) {
      const idx = outcomePatterns.indexOf(patternId);
      if (idx > -1) outcomePatterns.splice(idx, 1);
    }
  }

  getPattern(patternId: string): HistoricalPattern | undefined {
    return this.patterns.get(patternId);
  }

  getStats(): {
    totalPatterns: number;
    positivePatterns: number;
    negativePatterns: number;
    regimeDistribution: Record<string, number>;
  } {
    const positiveCount = this.index.byOutcome.get('positive')?.length ?? 0;
    const negativeCount = this.index.byOutcome.get('negative')?.length ?? 0;

    const regimeDistribution: Record<string, number> = {};
    for (const [regime, patterns] of this.index.byRegime) {
      regimeDistribution[regime] = patterns.length;
    }

    return {
      totalPatterns: this.patterns.size,
      positivePatterns: positiveCount,
      negativePatterns: negativeCount,
      regimeDistribution,
    };
  }

  exportPatterns(): HistoricalPattern[] {
    return Array.from(this.patterns.values());
  }

  importPatterns(patterns: HistoricalPattern[]): void {
    for (const pattern of patterns) {
      this.patterns.set(pattern.id, pattern);

      // Reconstruct fingerprint from stored data
      const fingerprint: PatternFingerprint = {
        features: pattern.structuralFingerprint,
        timestamp: pattern.timestamp,
        regime: pattern.regime.type,
      };
      this.fingerprints.set(pattern.id, fingerprint);

      // Update indices
      this.updateIndices(pattern.id, pattern, fingerprint);
    }
  }

  clear(): void {
    this.patterns.clear();
    this.fingerprints.clear();
    this.recentPatterns = new CircularBuffer(1000);
    this.index = {
      byRegime: new Map(),
      byOutcome: new Map(),
      byTimeframe: new Map(),
    };
    this.index.byOutcome.set('positive', []);
    this.index.byOutcome.set('negative', []);
  }
}

export default FractalMemory;
