/**
 * Data Processor Service
 * Real-time data transformation and derived metrics calculation
 */

import type { MarketData, StructuralFeatures, OHLCV } from '../core/types';
import { CircularBuffer } from '../utils/circularBuffer';
import { mean, standardDeviation, ema, correlation } from '../utils/math';

interface DerivedMetrics {
  movingAverages: {
    sma20: number;
    sma50: number;
    ema12: number;
    ema26: number;
  };
  momentum: number;
  volatility: number;
  correlations: Record<string, number>;
  structuralMetrics: {
    gammaConcentration: number;
    liquidityScore: number;
    coherence: number;
  };
}

interface VisualData {
  gammaSurface: Float32Array;
  liquidityParticles: Float32Array;
  priceThread: Float32Array;
  attentionHeatmap: number[][];
  animations: {
    pulseFrequency: number;
    flowSpeed: number;
    glowIntensity: number;
  };
}

type DataSubscriber = (data: { raw: MarketData; derived: DerivedMetrics }) => void;
type VisualSubscriber = (data: VisualData) => void;

export class DataProcessor {
  private dataBuffer: CircularBuffer<MarketData>;
  private priceBuffer: CircularBuffer<number>;
  private volumeBuffer: CircularBuffer<number>;
  private dataSubscribers: Set<DataSubscriber> = new Set();
  private visualSubscribers: Set<VisualSubscriber> = new Set();
  private lastProcessTime = 0;
  private processInterval = 16; // ~60fps
  private animationFrameId: number | null = null;

  constructor(bufferSize = 1000) {
    this.dataBuffer = new CircularBuffer(bufferSize);
    this.priceBuffer = new CircularBuffer(bufferSize);
    this.volumeBuffer = new CircularBuffer(bufferSize);
  }

  processUpdate(update: MarketData): void {
    // Add to buffers
    this.dataBuffer.add(update);

    const latestOHLCV = update.t1.ohlcv[update.t1.ohlcv.length - 1];
    if (latestOHLCV) {
      this.priceBuffer.add(latestOHLCV.close);
      this.volumeBuffer.add(latestOHLCV.volume);
    }

    // Calculate derived metrics
    const derived = this.calculateDerivedMetrics();

    // Notify data subscribers
    this.dataSubscribers.forEach((subscriber) => {
      subscriber({ raw: update, derived });
    });

    // Schedule visual update
    this.scheduleVisualUpdate(update, derived);
  }

  private calculateDerivedMetrics(): DerivedMetrics {
    const prices = this.priceBuffer.toArray();
    const volumes = this.volumeBuffer.toArray();
    const recentData = this.dataBuffer.getRecent(10);

    // Moving averages
    const sma20 = prices.length >= 20 ? mean(prices.slice(-20)) : mean(prices);
    const sma50 = prices.length >= 50 ? mean(prices.slice(-50)) : mean(prices);

    const ema12Values = ema(prices, 12);
    const ema26Values = ema(prices, 26);
    const ema12 = ema12Values[ema12Values.length - 1] ?? 0;
    const ema26 = ema26Values[ema26Values.length - 1] ?? 0;

    // Momentum
    const momentum = prices.length >= 10
      ? (prices[prices.length - 1] - prices[prices.length - 10]) / prices[prices.length - 10]
      : 0;

    // Volatility
    const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
    const volatility = standardDeviation(returns) * Math.sqrt(252) * 100;

    // Correlations
    const correlations: Record<string, number> = {};
    if (volumes.length === prices.length && prices.length > 10) {
      correlations['price_volume'] = correlation(prices.slice(-50), volumes.slice(-50));
    }

    // Structural metrics
    let gammaConcentration = 0;
    let liquidityScore = 0;
    let coherence = 0.5;

    if (recentData.length > 0) {
      const latestData = recentData[0];

      // Gamma concentration from options
      if (latestData.options.chain.length > 0) {
        const totalGamma = latestData.options.chain.reduce((sum, o) => sum + Math.abs(o.gamma * o.openInterest), 0);
        gammaConcentration = totalGamma / latestData.options.chain.length;
      }

      // Liquidity score from order book
      if (latestData.t1.orderBook) {
        const bidLiquidity = latestData.t1.orderBook.bids.reduce((sum, b) => sum + b.size, 0);
        const askLiquidity = latestData.t1.orderBook.asks.reduce((sum, a) => sum + a.size, 0);
        liquidityScore = (bidLiquidity + askLiquidity) / 2;
      }

      // Simple coherence estimate based on price-volume alignment
      if (correlations['price_volume'] !== undefined) {
        coherence = Math.abs(correlations['price_volume']);
      }
    }

    return {
      movingAverages: { sma20, sma50, ema12, ema26 },
      momentum,
      volatility,
      correlations,
      structuralMetrics: {
        gammaConcentration,
        liquidityScore,
        coherence,
      },
    };
  }

  private scheduleVisualUpdate(data: MarketData, derived: DerivedMetrics): void {
    const now = performance.now();

    if (now - this.lastProcessTime >= this.processInterval) {
      this.lastProcessTime = now;
      this.processBatch(data, derived);
    }
  }

  private processBatch(data: MarketData, derived: DerivedMetrics): void {
    const visualData = this.prepareVisualizationData(data, derived);
    this.visualSubscribers.forEach((subscriber) => {
      subscriber(visualData);
    });
  }

  private prepareVisualizationData(data: MarketData, derived: DerivedMetrics): VisualData {
    // Gamma surface geometry
    const gammaSurface = this.createGammaSurfaceGeometry(data);

    // Liquidity particles
    const liquidityParticles = this.createParticleData(data, derived.momentum);

    // Price thread
    const priceThread = this.createLineGeometry();

    // Attention heatmap
    const attentionHeatmap = this.createHeatmapData(derived);

    // Animation parameters
    const animations = {
      pulseFrequency: derived.volatility * 0.01 + 0.5,
      flowSpeed: Math.abs(derived.momentum) * 10 + 1,
      glowIntensity: derived.structuralMetrics.coherence,
    };

    return {
      gammaSurface,
      liquidityParticles,
      priceThread,
      attentionHeatmap,
      animations,
    };
  }

  private createGammaSurfaceGeometry(data: MarketData): Float32Array {
    const vertices: number[] = [];
    const strikes = [...new Set(data.options.chain.map((o) => o.strike))].sort((a, b) => a - b);
    const expiries = [...new Set(data.options.chain.map((o) => o.expiry))].sort((a, b) => a - b);

    const gridSize = 32;
    const spotPrice = data.options.underlyingPrice;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const x = (i / (gridSize - 1)) * 2 - 1; // -1 to 1
        const y = (j / (gridSize - 1)) * 2 - 1; // -1 to 1

        // Map to strike/expiry space
        const strikeIndex = Math.floor((i / gridSize) * strikes.length);
        const expiryIndex = Math.floor((j / gridSize) * expiries.length);

        // Find nearest option
        const strike = strikes[strikeIndex] ?? spotPrice;
        const expiry = expiries[expiryIndex] ?? 0;

        const nearbyOptions = data.options.chain.filter(
          (o) => Math.abs(o.strike - strike) < strike * 0.05 && o.expiry === expiry
        );

        // Calculate gamma at this point
        const totalGamma = nearbyOptions.reduce(
          (sum, o) => sum + o.gamma * o.openInterest * 100,
          0
        );

        const z = Math.tanh(totalGamma / 10000) * 0.5; // Normalize height

        vertices.push(x, z, y); // x, y (height), z
      }
    }

    return new Float32Array(vertices);
  }

  private createParticleData(data: MarketData, momentum: number): Float32Array {
    const particles: number[] = [];
    const orderBook = data.t1.orderBook;

    if (!orderBook) return new Float32Array(0);

    // Create particles for bids
    for (const bid of orderBook.bids.slice(0, 20)) {
      const particleCount = Math.min(5, Math.floor(bid.size / 100));
      for (let i = 0; i < particleCount; i++) {
        particles.push(
          (Math.random() - 0.5) * 2, // x
          (bid.price / orderBook.midPrice - 1) * 10, // y (normalized price)
          (Math.random() - 0.5) * 2, // z
          0, // color type (0 = bid)
          bid.size / 1000, // size
          momentum * 0.1 // velocity modifier
        );
      }
    }

    // Create particles for asks
    for (const ask of orderBook.asks.slice(0, 20)) {
      const particleCount = Math.min(5, Math.floor(ask.size / 100));
      for (let i = 0; i < particleCount; i++) {
        particles.push(
          (Math.random() - 0.5) * 2, // x
          (ask.price / orderBook.midPrice - 1) * 10, // y
          (Math.random() - 0.5) * 2, // z
          1, // color type (1 = ask)
          ask.size / 1000, // size
          momentum * 0.1 // velocity modifier
        );
      }
    }

    return new Float32Array(particles);
  }

  private createLineGeometry(): Float32Array {
    const prices = this.priceBuffer.toArray();
    const points: number[] = [];

    if (prices.length === 0) return new Float32Array(0);

    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    for (let i = 0; i < prices.length; i++) {
      const x = (i / prices.length) * 2 - 1; // -1 to 1
      const y = ((prices[i] - minPrice) / range) * 2 - 1; // -1 to 1
      const z = 0;

      points.push(x, y, z);
    }

    return new Float32Array(points);
  }

  private createHeatmapData(derived: DerivedMetrics): number[][] {
    const size = 10;
    const heatmap: number[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(0));

    // Create heatmap based on derived metrics
    const momentumX = Math.floor(((derived.momentum + 0.1) / 0.2) * (size - 1));
    const volatilityY = Math.floor((derived.volatility / 100) * (size - 1));

    // Set values with gaussian spread
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - Math.max(0, Math.min(size - 1, momentumX));
        const dy = y - Math.max(0, Math.min(size - 1, volatilityY));
        const distance = Math.sqrt(dx * dx + dy * dy);
        heatmap[y][x] = Math.exp(-distance * 0.5) * derived.structuralMetrics.coherence;
      }
    }

    return heatmap;
  }

  subscribeToData(callback: DataSubscriber): () => void {
    this.dataSubscribers.add(callback);
    return () => this.dataSubscribers.delete(callback);
  }

  subscribeToVisuals(callback: VisualSubscriber): () => void {
    this.visualSubscribers.add(callback);
    return () => this.visualSubscribers.delete(callback);
  }

  getRecentData(count: number): MarketData[] {
    return this.dataBuffer.getRecent(count);
  }

  getPrices(): number[] {
    return this.priceBuffer.toArray();
  }

  getVolumes(): number[] {
    return this.volumeBuffer.toArray();
  }

  clear(): void {
    this.dataBuffer = new CircularBuffer(this.dataBuffer.capacity);
    this.priceBuffer = new CircularBuffer(this.priceBuffer.capacity);
    this.volumeBuffer = new CircularBuffer(this.volumeBuffer.capacity);
  }
}

export default DataProcessor;
