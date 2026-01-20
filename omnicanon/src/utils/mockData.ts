/**
 * Mock Data Generator
 * Generates realistic-looking market data for development/demo
 */

import type { MarketData, OHLCV, OptionData, OrderBook, Trade } from '../core/types';

let lastPrice = 450;
let priceHistory: number[] = [];

export function generateMockMarketData(): MarketData {
  const timestamp = Date.now();

  // Generate price movement (random walk with mean reversion)
  const drift = (450 - lastPrice) * 0.001; // Mean reversion to 450
  const volatility = 0.5 + Math.random() * 0.5;
  const change = drift + (Math.random() - 0.5) * volatility;
  lastPrice = Math.max(400, Math.min(500, lastPrice + change));

  priceHistory.push(lastPrice);
  if (priceHistory.length > 500) priceHistory.shift();

  // Generate OHLCV data
  const t1Ohlcv = generateOHLCV(lastPrice, 100);
  const t2Ohlcv = generateOHLCV(lastPrice, 20);

  // Generate trades
  const trades = generateTrades(lastPrice, 50);

  // Generate order book
  const orderBook = generateOrderBook(lastPrice);

  // Generate options chain
  const optionsChain = generateOptionsChain(lastPrice);

  return {
    symbol: 'SPY',
    timestamp,
    t1: {
      ohlcv: t1Ohlcv,
      trades,
      orderBook,
    },
    t2: {
      ohlcv: t2Ohlcv,
      trades: trades.slice(0, 10),
    },
    options: {
      chain: optionsChain,
      underlyingPrice: lastPrice,
      underlyingVolume: Math.floor(Math.random() * 10000000) + 5000000,
    },
  };
}

function generateOHLCV(currentPrice: number, count: number): OHLCV[] {
  const result: OHLCV[] = [];
  let price = currentPrice - count * 0.1;

  for (let i = 0; i < count; i++) {
    const change = (Math.random() - 0.48) * 0.5; // Slight upward bias
    price = Math.max(400, Math.min(500, price + change));

    const high = price + Math.random() * 0.3;
    const low = price - Math.random() * 0.3;
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);

    result.push({
      timestamp: Date.now() - (count - i) * 60000,
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 100000) + 50000,
    });
  }

  return result;
}

function generateTrades(price: number, count: number): Trade[] {
  const trades: Trade[] = [];

  for (let i = 0; i < count; i++) {
    const tradePrice = price + (Math.random() - 0.5) * 0.2;
    const side = Math.random() > 0.5 ? 'buy' : 'sell';

    trades.push({
      timestamp: Date.now() - i * 100,
      price: tradePrice,
      size: Math.floor(Math.random() * 1000) + 100,
      side,
      exchange: ['NYSE', 'NASDAQ', 'ARCA', 'BATS'][Math.floor(Math.random() * 4)],
    });
  }

  return trades;
}

function generateOrderBook(price: number): OrderBook {
  const bids = [];
  const asks = [];
  const spread = 0.01 + Math.random() * 0.02;

  // Generate bid levels
  for (let i = 0; i < 20; i++) {
    const bidPrice = price - spread / 2 - i * 0.01;
    bids.push({
      price: bidPrice,
      size: Math.floor(Math.random() * 5000) + 1000,
      side: 'bid' as const,
      orders: Math.floor(Math.random() * 10) + 1,
    });
  }

  // Generate ask levels
  for (let i = 0; i < 20; i++) {
    const askPrice = price + spread / 2 + i * 0.01;
    asks.push({
      price: askPrice,
      size: Math.floor(Math.random() * 5000) + 1000,
      side: 'ask' as const,
      orders: Math.floor(Math.random() * 10) + 1,
    });
  }

  return {
    timestamp: Date.now(),
    bids,
    asks,
    spread,
    midPrice: price,
  };
}

function generateOptionsChain(spotPrice: number): OptionData[] {
  const chain: OptionData[] = [];
  const strikes = [];

  // Generate strikes around spot price
  for (let i = -10; i <= 10; i++) {
    strikes.push(Math.round(spotPrice + i * 5));
  }

  // Generate expiries (weekly for 8 weeks)
  const now = Date.now();
  const expiries = [];
  for (let i = 1; i <= 8; i++) {
    expiries.push(now + i * 7 * 24 * 60 * 60 * 1000);
  }

  for (const expiry of expiries) {
    const dte = (expiry - now) / (24 * 60 * 60 * 1000);

    for (const strike of strikes) {
      // Generate call
      const callIV = 0.2 + Math.random() * 0.1 + Math.abs(strike - spotPrice) * 0.002;
      const callDelta = Math.max(0, Math.min(1, 0.5 + (spotPrice - strike) / (spotPrice * 0.1)));
      const callGamma = Math.exp(-Math.pow((strike - spotPrice) / (spotPrice * 0.1), 2) / 2) * 0.1;

      chain.push({
        strike,
        expiry,
        type: 'call',
        bid: Math.max(0.01, (spotPrice - strike) * 0.8 + Math.random() * 2),
        ask: Math.max(0.02, (spotPrice - strike) * 0.8 + Math.random() * 2 + 0.05),
        last: Math.max(0.01, (spotPrice - strike) * 0.8 + Math.random() * 2),
        volume: Math.floor(Math.random() * 5000),
        openInterest: Math.floor(Math.random() * 50000) + 1000,
        impliedVolatility: callIV,
        delta: callDelta,
        gamma: callGamma,
        theta: -callGamma * spotPrice * callIV / (2 * Math.sqrt(dte / 365)),
        vega: callGamma * spotPrice * Math.sqrt(dte / 365) / 100,
        rho: 0.01 * callDelta,
      });

      // Generate put
      const putIV = callIV + 0.02 * (1 - callDelta); // Skew
      const putDelta = callDelta - 1;
      const putGamma = callGamma;

      chain.push({
        strike,
        expiry,
        type: 'put',
        bid: Math.max(0.01, (strike - spotPrice) * 0.8 + Math.random() * 2),
        ask: Math.max(0.02, (strike - spotPrice) * 0.8 + Math.random() * 2 + 0.05),
        last: Math.max(0.01, (strike - spotPrice) * 0.8 + Math.random() * 2),
        volume: Math.floor(Math.random() * 5000),
        openInterest: Math.floor(Math.random() * 50000) + 1000,
        impliedVolatility: putIV,
        delta: putDelta,
        gamma: putGamma,
        theta: -putGamma * spotPrice * putIV / (2 * Math.sqrt(dte / 365)),
        vega: putGamma * spotPrice * Math.sqrt(dte / 365) / 100,
        rho: 0.01 * putDelta,
      });
    }
  }

  return chain;
}

export function resetMockData(): void {
  lastPrice = 450;
  priceHistory = [];
}
