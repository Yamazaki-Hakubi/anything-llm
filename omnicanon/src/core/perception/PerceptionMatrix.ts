/**
 * Perception Matrix
 * Transforms raw market data into structural understanding
 */

import type {
  MarketData,
  StructuralFeatures,
  GammaSurface,
  GammaFlip,
  GravitationalPull,
  LiquidityMap,
  LiquidityLevel,
  VolatilityState,
  VolatilityRegime,
  DealerPositioning,
  ConstraintField,
  PriceHistory,
  OHLCV,
  OptionData,
  OrderBook,
} from '../types';
import { mean, standardDeviation, ema, clamp, mapRange } from '../../utils/math';
import { CircularBuffer } from '../../utils/circularBuffer';

export class PerceptionMatrix {
  private priceBuffer: CircularBuffer<number>;
  private volumeBuffer: CircularBuffer<number>;
  private volatilityBuffer: CircularBuffer<number>;
  private lastProcessedTimestamp = 0;

  constructor(private bufferSize = 1000) {
    this.priceBuffer = new CircularBuffer(bufferSize);
    this.volumeBuffer = new CircularBuffer(bufferSize);
    this.volatilityBuffer = new CircularBuffer(bufferSize);
  }

  process(rawData: MarketData): StructuralFeatures {
    // Update buffers
    const latestPrice = rawData.t1.ohlcv[rawData.t1.ohlcv.length - 1]?.close ?? 0;
    const latestVolume = rawData.t1.ohlcv[rawData.t1.ohlcv.length - 1]?.volume ?? 0;
    this.priceBuffer.add(latestPrice);
    this.volumeBuffer.add(latestVolume);

    // Extract all structural features
    const gammaSurface = this.calculateGammaSurface(
      rawData.options.chain,
      rawData.options.underlyingPrice
    );

    const gammaFlips = this.findGammaFlips(gammaSurface);

    const gammaPull = this.calculateGravitationalPull(
      gammaSurface,
      rawData.options.underlyingPrice
    );

    const liquidityMap = this.buildLiquidityMap(
      rawData.t1.orderBook,
      rawData.t1.trades
    );

    const volatilityRegime = this.classifyVolatilityRegime(
      rawData.t1.ohlcv,
      rawData.options.chain
    );

    const dealerPositioning = this.inferDealerPositioning(
      rawData.options.chain,
      gammaSurface
    );

    const constraintField: ConstraintField = {
      gamma: gammaSurface,
      liquidity: liquidityMap,
      volatility: volatilityRegime,
      dealerPositioning,
      gravitationalPull: gammaPull,
    };

    const priceHistory = this.buildPriceHistory();

    this.lastProcessedTimestamp = rawData.timestamp;

    return {
      gammaSurface,
      gammaFlips,
      gammaPull,
      liquidityMap,
      volatilityRegime,
      dealerPositioning,
      constraintField,
      priceHistory,
      timestamp: rawData.timestamp,
    };
  }

  private calculateGammaSurface(
    optionsChain: OptionData[],
    spotPrice: number
  ): GammaSurface {
    // Get unique strikes and expiries
    const strikes = [...new Set(optionsChain.map((o) => o.strike))].sort(
      (a, b) => a - b
    );
    const expiries = [...new Set(optionsChain.map((o) => o.expiry))].sort(
      (a, b) => a - b
    );

    // Build gamma matrix
    const values: number[][] = [];
    let maxGamma = -Infinity;
    let minGamma = Infinity;
    let netGamma = 0;

    for (const expiry of expiries) {
      const row: number[] = [];
      for (const strike of strikes) {
        // Find options at this strike/expiry
        const options = optionsChain.filter(
          (o) => o.strike === strike && o.expiry === expiry
        );

        // Sum gamma for all options at this point
        let totalGamma = 0;
        for (const opt of options) {
          // Weight gamma by open interest (dealer exposure proxy)
          const weightedGamma = opt.gamma * opt.openInterest * 100; // 100 shares per contract
          totalGamma += weightedGamma;
        }

        row.push(totalGamma);
        netGamma += totalGamma;

        if (totalGamma > maxGamma) maxGamma = totalGamma;
        if (totalGamma < minGamma) minGamma = totalGamma;
      }
      values.push(row);
    }

    return {
      strikes,
      expiries,
      values,
      maxGamma,
      minGamma,
      netGamma,
    };
  }

  private findGammaFlips(gammaSurface: GammaSurface): GammaFlip[] {
    const flips: GammaFlip[] = [];

    for (let e = 0; e < gammaSurface.expiries.length; e++) {
      const row = gammaSurface.values[e];

      for (let s = 1; s < row.length; s++) {
        const prevGamma = row[s - 1];
        const currGamma = row[s];

        // Check for sign change
        if (prevGamma * currGamma < 0) {
          const price =
            (gammaSurface.strikes[s - 1] + gammaSurface.strikes[s]) / 2;
          const strength = Math.abs(currGamma - prevGamma);
          const type =
            prevGamma > 0 ? 'positive_to_negative' : 'negative_to_positive';

          flips.push({
            price,
            strength,
            type,
            expiry: gammaSurface.expiries[e],
          });
        }
      }
    }

    return flips.sort((a, b) => b.strength - a.strength);
  }

  private calculateGravitationalPull(
    gammaSurface: GammaSurface,
    spotPrice: number
  ): GravitationalPull {
    const attractors: GravitationalPull['attractors'] = [];

    // Find gamma concentrations (attractors)
    for (let e = 0; e < gammaSurface.expiries.length; e++) {
      const row = gammaSurface.values[e];

      for (let s = 0; s < row.length; s++) {
        const gamma = row[s];
        const strike = gammaSurface.strikes[s];

        // Only consider significant gamma concentrations
        if (
          Math.abs(gamma) >
          Math.abs(gammaSurface.maxGamma - gammaSurface.minGamma) * 0.1
        ) {
          attractors.push({
            price: strike,
            strength: gamma,
            type: 'gamma_max',
          });
        }
      }
    }

    // Calculate net gravitational pull direction and magnitude
    let totalPull = 0;
    let weightedSum = 0;

    for (const attractor of attractors) {
      const distance = attractor.price - spotPrice;
      if (distance !== 0) {
        // Inverse square law with gamma as mass
        const pull = attractor.strength / (distance * distance);
        totalPull += Math.abs(pull);
        weightedSum += pull * Math.sign(distance);
      }
    }

    const direction = weightedSum > 0 ? 1 : weightedSum < 0 ? -1 : 0;
    const magnitude = Math.min(Math.abs(weightedSum) / (totalPull || 1), 1);

    return {
      direction,
      magnitude,
      attractors: attractors.slice(0, 10), // Top 10 attractors
    };
  }

  private buildLiquidityMap(
    orderBook: OrderBook,
    trades: Array<{ price: number; size: number; side: 'buy' | 'sell' }>
  ): LiquidityMap {
    const levels: LiquidityLevel[] = [];

    // Process bids
    for (const level of orderBook.bids) {
      // Calculate flow rate from recent trades near this level
      const nearbyTrades = trades.filter(
        (t) => Math.abs(t.price - level.price) < level.price * 0.001
      );
      const flowRate = nearbyTrades.reduce((sum, t) => sum + t.size, 0);

      levels.push({
        price: level.price,
        volume: level.size,
        side: 'bid',
        flowRate,
        persistence: 1, // Would be calculated from historical data
      });
    }

    // Process asks
    for (const level of orderBook.asks) {
      const nearbyTrades = trades.filter(
        (t) => Math.abs(t.price - level.price) < level.price * 0.001
      );
      const flowRate = nearbyTrades.reduce((sum, t) => sum + t.size, 0);

      levels.push({
        price: level.price,
        volume: level.size,
        side: 'ask',
        flowRate,
        persistence: 1,
      });
    }

    // Calculate imbalance
    const bidVolume = orderBook.bids.reduce((sum, b) => sum + b.size, 0);
    const askVolume = orderBook.asks.reduce((sum, a) => sum + a.size, 0);
    const totalVolume = bidVolume + askVolume;
    const imbalance = totalVolume > 0 ? (bidVolume - askVolume) / totalVolume : 0;

    // Calculate depth (volume within 1% of mid)
    const midPrice = orderBook.midPrice;
    const threshold = midPrice * 0.01;
    const nearBids = orderBook.bids.filter(
      (b) => midPrice - b.price <= threshold
    );
    const nearAsks = orderBook.asks.filter(
      (a) => a.price - midPrice <= threshold
    );
    const depth =
      nearBids.reduce((sum, b) => sum + b.size, 0) +
      nearAsks.reduce((sum, a) => sum + a.size, 0);

    // Calculate absorption rate (how quickly liquidity is consumed)
    const recentVolume = trades.slice(-100).reduce((sum, t) => sum + t.size, 0);
    const absorptionRate = totalVolume > 0 ? recentVolume / totalVolume : 0;

    return {
      levels,
      imbalance,
      depth,
      absorptionRate,
    };
  }

  private classifyVolatilityRegime(
    ohlcv: OHLCV[],
    optionsChain: OptionData[]
  ): VolatilityState {
    // Calculate historical volatility
    const closes = ohlcv.map((c) => c.close);
    const returns: number[] = [];
    for (let i = 1; i < closes.length; i++) {
      returns.push(Math.log(closes[i] / closes[i - 1]));
    }

    const historicalVol = standardDeviation(returns) * Math.sqrt(252) * 100; // Annualized %
    this.volatilityBuffer.add(historicalVol);

    // Calculate average implied volatility from options
    const ivs = optionsChain
      .filter((o) => o.impliedVolatility > 0)
      .map((o) => o.impliedVolatility * 100);
    const impliedVol = ivs.length > 0 ? mean(ivs) : historicalVol;

    // Vol spread (IV - HV)
    const volSpread = impliedVol - historicalVol;

    // Volatility of volatility
    const volOfVol = standardDeviation(this.volatilityBuffer.toArray());

    // Calculate skew (difference between OTM puts and ATM)
    const atmOptions = optionsChain.filter(
      (o) => Math.abs(o.delta) > 0.4 && Math.abs(o.delta) < 0.6
    );
    const otmPuts = optionsChain.filter(
      (o) => o.type === 'put' && Math.abs(o.delta) < 0.25
    );

    const atmIV = atmOptions.length > 0 ? mean(atmOptions.map((o) => o.impliedVolatility)) : impliedVol / 100;
    const otmPutIV = otmPuts.length > 0 ? mean(otmPuts.map((o) => o.impliedVolatility)) : atmIV;
    const skew = (otmPutIV - atmIV) * 100;

    // Calculate term structure (near vs far)
    const nearExpiry = Math.min(...optionsChain.map((o) => o.expiry));
    const nearOptions = optionsChain.filter((o) => o.expiry === nearExpiry);
    const farOptions = optionsChain.filter((o) => o.expiry !== nearExpiry);

    const nearIV = nearOptions.length > 0 ? mean(nearOptions.map((o) => o.impliedVolatility)) : impliedVol / 100;
    const farIV = farOptions.length > 0 ? mean(farOptions.map((o) => o.impliedVolatility)) : nearIV;
    const term = (farIV - nearIV) * 100;

    // Classify regime
    let regime: VolatilityRegime;
    if (impliedVol < 15) {
      regime = 'low';
    } else if (impliedVol < 25) {
      regime = 'normal';
    } else if (impliedVol < 35) {
      regime = 'elevated';
    } else if (impliedVol < 50) {
      regime = 'high';
    } else {
      regime = 'extreme';
    }

    return {
      regime,
      historicalVol,
      impliedVol,
      volSpread,
      volOfVol,
      skew,
      term,
    };
  }

  private inferDealerPositioning(
    optionsChain: OptionData[],
    gammaSurface: GammaSurface
  ): DealerPositioning {
    // Net gamma exposure (dealers are typically short gamma to retail)
    const netGammaExposure = gammaSurface.netGamma;

    // Net delta exposure
    let netDelta = 0;
    for (const opt of optionsChain) {
      // Assume dealers are short what retail is long
      netDelta -= opt.delta * opt.openInterest * 100;
    }

    // Hedging pressure (how much dealers need to hedge)
    // Negative gamma = need to buy dips, sell rips (stabilizing when small, amplifying when large)
    const hedgingPressure = -netGammaExposure * 0.01; // Normalized

    // Infer flow direction from volume and open interest changes
    const callVolume = optionsChain
      .filter((o) => o.type === 'call')
      .reduce((sum, o) => sum + o.volume, 0);
    const putVolume = optionsChain
      .filter((o) => o.type === 'put')
      .reduce((sum, o) => sum + o.volume, 0);

    const putCallRatio = callVolume > 0 ? putVolume / callVolume : 1;

    let flowDirection: DealerPositioning['flowDirection'];
    if (putCallRatio < 0.7) {
      flowDirection = 'buying';
    } else if (putCallRatio > 1.3) {
      flowDirection = 'selling';
    } else {
      flowDirection = 'neutral';
    }

    // Confidence in our inference
    const totalOI = optionsChain.reduce((sum, o) => sum + o.openInterest, 0);
    const confidence = clamp(totalOI / 100000, 0, 1); // Higher OI = more confidence

    return {
      netGammaExposure,
      netDeltaExposure: netDelta,
      hedgingPressure,
      flowDirection,
      confidence,
    };
  }

  private buildPriceHistory(): PriceHistory {
    const prices = this.priceBuffer.toArray();
    const timestamps = prices.map((_, i) => Date.now() - (prices.length - i) * 1000);

    if (prices.length < 2) {
      return {
        prices,
        timestamps,
        momentum: 0,
        trend: 'sideways',
        trendStrength: 0,
      };
    }

    // Calculate momentum using rate of change
    const shortEma = ema(prices, 10);
    const longEma = ema(prices, 30);

    const latestShort = shortEma[shortEma.length - 1];
    const latestLong = longEma[longEma.length - 1];

    const momentum = latestLong !== 0 ? (latestShort - latestLong) / latestLong : 0;

    // Determine trend
    let trend: PriceHistory['trend'];
    if (momentum > 0.005) {
      trend = 'up';
    } else if (momentum < -0.005) {
      trend = 'down';
    } else {
      trend = 'sideways';
    }

    // Calculate trend strength using price position relative to range
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    const range = high - low;
    const latestPrice = prices[prices.length - 1];
    const trendStrength = range > 0 ? Math.abs(latestPrice - (high + low) / 2) / (range / 2) : 0;

    return {
      prices,
      timestamps,
      momentum,
      trend,
      trendStrength,
    };
  }

  getLatestPrice(): number {
    const prices = this.priceBuffer.getRecent(1);
    return prices[0] ?? 0;
  }

  getBufferStats(): { priceCount: number; volatility: number } {
    return {
      priceCount: this.priceBuffer.size,
      volatility: this.volatilityBuffer.average(),
    };
  }
}

export default PerceptionMatrix;
