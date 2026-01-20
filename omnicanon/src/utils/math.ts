/**
 * Mathematical Utilities for OMNICANON
 */

// Sigmoid activation function
export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// Hyperbolic tangent
export function tanh(x: number): number {
  return Math.tanh(x);
}

// ReLU activation
export function relu(x: number): number {
  return Math.max(0, x);
}

// Leaky ReLU
export function leakyRelu(x: number, alpha = 0.01): number {
  return x > 0 ? x : alpha * x;
}

// Softmax for array
export function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exp = arr.map((x) => Math.exp(x - max));
  const sum = exp.reduce((a, b) => a + b, 0);
  return exp.map((x) => x / sum);
}

// Linear interpolation
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Clamp value to range
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// Map value from one range to another
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

// Standard deviation
export function standardDeviation(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squareDiffs = arr.map((x) => Math.pow(x - mean, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(avgSquareDiff);
}

// Mean
export function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

// Median
export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Exponential moving average
export function ema(arr: number[], period: number): number[] {
  if (arr.length === 0) return [];
  const multiplier = 2 / (period + 1);
  const result: number[] = [arr[0]];

  for (let i = 1; i < arr.length; i++) {
    result.push((arr[i] - result[i - 1]) * multiplier + result[i - 1]);
  }

  return result;
}

// Simple moving average
export function sma(arr: number[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = arr.slice(i - period + 1, i + 1);
      result.push(mean(slice));
    }
  }

  return result;
}

// Bollinger Bands
export function bollingerBands(
  arr: number[],
  period: number,
  stdDevMultiplier = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = sma(arr, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < arr.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = arr.slice(i - period + 1, i + 1);
      const std = standardDeviation(slice);
      upper.push(middle[i] + stdDevMultiplier * std);
      lower.push(middle[i] - stdDevMultiplier * std);
    }
  }

  return { upper, middle, lower };
}

// Relative Strength Index (RSI)
export function rsi(arr: number[], period = 14): number[] {
  const changes: number[] = [];
  for (let i = 1; i < arr.length; i++) {
    changes.push(arr[i] - arr[i - 1]);
  }

  const gains: number[] = [];
  const losses: number[] = [];

  for (const change of changes) {
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }

  const avgGain = ema(gains, period);
  const avgLoss = ema(losses, period);

  const result: number[] = [NaN]; // First value is NaN

  for (let i = 0; i < avgGain.length; i++) {
    if (avgLoss[i] === 0) {
      result.push(100);
    } else {
      const rs = avgGain[i] / avgLoss[i];
      result.push(100 - 100 / (1 + rs));
    }
  }

  return result;
}

// MACD
export function macd(
  arr: number[],
  fastPeriod = 12,
  slowPeriod = 26,
  signalPeriod = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const fastEma = ema(arr, fastPeriod);
  const slowEma = ema(arr, slowPeriod);

  const macdLine: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    macdLine.push(fastEma[i] - slowEma[i]);
  }

  const signalLine = ema(macdLine, signalPeriod);

  const histogram: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }

  return { macd: macdLine, signal: signalLine, histogram };
}

// Pearson correlation coefficient
export function correlation(arr1: number[], arr2: number[]): number {
  if (arr1.length !== arr2.length || arr1.length === 0) return 0;

  const mean1 = mean(arr1);
  const mean2 = mean(arr2);

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < arr1.length; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  const denominator = Math.sqrt(denom1 * denom2);
  return denominator === 0 ? 0 : numerator / denominator;
}

// Calculate returns from prices
export function returns(prices: number[]): number[] {
  const result: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    result.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return result;
}

// Sharpe ratio
export function sharpeRatio(
  returns: number[],
  riskFreeRate = 0,
  annualizationFactor = 252
): number {
  if (returns.length === 0) return 0;

  const meanReturn = mean(returns);
  const stdDev = standardDeviation(returns);

  if (stdDev === 0) return 0;

  const excessReturn = meanReturn - riskFreeRate / annualizationFactor;
  return (excessReturn / stdDev) * Math.sqrt(annualizationFactor);
}

// Maximum drawdown
export function maxDrawdown(equity: number[]): number {
  if (equity.length === 0) return 0;

  let maxValue = equity[0];
  let maxDD = 0;

  for (const value of equity) {
    if (value > maxValue) {
      maxValue = value;
    }
    const dd = (maxValue - value) / maxValue;
    if (dd > maxDD) {
      maxDD = dd;
    }
  }

  return maxDD;
}

// Kelly criterion
export function kellyCriterion(winRate: number, avgWin: number, avgLoss: number): number {
  if (avgLoss === 0) return 0;
  const winLossRatio = avgWin / avgLoss;
  return winRate - (1 - winRate) / winLossRatio;
}

// Euclidean distance
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) return Infinity;

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += Math.pow(a[i] - b[i], 2);
  }

  return Math.sqrt(sum);
}

// Cosine similarity
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// Normalize array to [0, 1]
export function normalize(arr: number[]): number[] {
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const range = max - min;

  if (range === 0) return arr.map(() => 0.5);

  return arr.map((x) => (x - min) / range);
}

// Z-score normalization
export function zScore(arr: number[]): number[] {
  const m = mean(arr);
  const std = standardDeviation(arr);

  if (std === 0) return arr.map(() => 0);

  return arr.map((x) => (x - m) / std);
}

// Generate random number in range
export function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

// Generate random integer in range (inclusive)
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Gaussian random number (Box-Muller transform)
export function gaussianRandom(mean = 0, stdDev = 1): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return z0 * stdDev + mean;
}

// Smoothstep interpolation
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

// Hermite interpolation
export function hermite(t: number): number {
  return t * t * (3 - 2 * t);
}

// Quintic interpolation
export function quintic(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
