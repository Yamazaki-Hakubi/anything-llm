/**
 * OMNICANON Core Types
 * Fractal-Resonant Trading System Type Definitions
 */

// ============================================================================
// MARKET DATA TYPES
// ============================================================================

export interface OHLCV {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OptionData {
  strike: number;
  expiry: number;
  type: 'call' | 'put';
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OrderBookLevel {
  price: number;
  size: number;
  side: 'bid' | 'ask';
  orders: number;
}

export interface OrderBook {
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  midPrice: number;
}

export interface Trade {
  timestamp: number;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  exchange: string;
}

export interface MarketData {
  symbol: string;
  timestamp: number;
  t1: {
    ohlcv: OHLCV[];
    trades: Trade[];
    orderBook: OrderBook;
  };
  t2: {
    ohlcv: OHLCV[];
    trades: Trade[];
  };
  options: {
    chain: OptionData[];
    underlyingPrice: number;
    underlyingVolume: number;
  };
}

// ============================================================================
// STRUCTURAL FEATURES
// ============================================================================

export interface GammaSurface {
  strikes: number[];
  expiries: number[];
  values: number[][];
  maxGamma: number;
  minGamma: number;
  netGamma: number;
}

export interface GammaFlip {
  price: number;
  strength: number;
  type: 'positive_to_negative' | 'negative_to_positive';
  expiry: number;
}

export interface GravitationalPull {
  direction: number;
  magnitude: number;
  attractors: Array<{
    price: number;
    strength: number;
    type: 'gamma_max' | 'liquidity_pocket' | 'volume_node';
  }>;
}

export interface LiquidityLevel {
  price: number;
  volume: number;
  side: 'bid' | 'ask';
  flowRate: number;
  persistence: number;
}

export interface LiquidityMap {
  levels: LiquidityLevel[];
  imbalance: number;
  depth: number;
  absorptionRate: number;
}

export type VolatilityRegime = 'low' | 'normal' | 'elevated' | 'high' | 'extreme';

export interface VolatilityState {
  regime: VolatilityRegime;
  historicalVol: number;
  impliedVol: number;
  volSpread: number;
  volOfVol: number;
  skew: number;
  term: number;
}

export interface DealerPositioning {
  netGammaExposure: number;
  netDeltaExposure: number;
  hedgingPressure: number;
  flowDirection: 'buying' | 'selling' | 'neutral';
  confidence: number;
}

export interface ConstraintField {
  gamma: GammaSurface;
  liquidity: LiquidityMap;
  volatility: VolatilityState;
  dealerPositioning: DealerPositioning;
  gravitationalPull: GravitationalPull;
}

export interface PriceHistory {
  prices: number[];
  timestamps: number[];
  momentum: number;
  trend: 'up' | 'down' | 'sideways';
  trendStrength: number;
}

export interface StructuralFeatures {
  gammaSurface: GammaSurface;
  gammaFlips: GammaFlip[];
  gammaPull: GravitationalPull;
  liquidityMap: LiquidityMap;
  volatilityRegime: VolatilityState;
  dealerPositioning: DealerPositioning;
  constraintField: ConstraintField;
  priceHistory: PriceHistory;
  timestamp: number;
}

// ============================================================================
// REGIME & COHERENCE
// ============================================================================

export type RegimeType =
  | 'trending_bullish'
  | 'trending_bearish'
  | 'range_bound'
  | 'breakout'
  | 'breakdown'
  | 'consolidation'
  | 'high_volatility'
  | 'low_volatility'
  | 'gamma_squeeze'
  | 'mean_reversion';

export interface Regime {
  type: RegimeType;
  confidence: number;
  duration: number;
  transitionProbability: number;
  characteristics: {
    volatility: VolatilityRegime;
    trend: 'up' | 'down' | 'sideways';
    momentum: number;
    marketPhase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  };
}

export interface CoherenceScore {
  total: number;
  confidence: number;
  structural: number;
  regime: number;
  temporal: number;
  fractal: number;
  convergence: number;
  components: {
    marketSystemAlignment: number;
    signalConsistency: number;
    timeframeHarmony: number;
    patternRecognition: number;
  };
}

// ============================================================================
// STRATEGY & SIGNALS
// ============================================================================

export type StrategyType =
  | 'gamma_scalp'
  | 'momentum_follow'
  | 'mean_reversion'
  | 'volatility_expansion'
  | 'volatility_contraction'
  | 'liquidity_hunt'
  | 'flow_alignment'
  | 'structural_break'
  | 'pattern_recognition'
  | 'fractal_resonance';

export interface StrategyTemplate {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  validRegimes: RegimeType[];
  activationThreshold: number;
  parameters: Record<string, number>;
  expectedWinRate: number;
  expectedRiskReward: number;
  timeframe: number; // in minutes
}

export interface ActiveStrategy {
  template: StrategyTemplate;
  activationScore: number;
  parameters: Record<string, number>;
  context: {
    structuralFeatures: StructuralFeatures;
    regime: Regime;
    coherence: CoherenceScore;
  };
  currentSignal: Signal | null;
  performance: StrategyPerformance;
  isActive: boolean;
}

export interface StrategyPerformance {
  totalTrades: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  recentPerformance: number;
  adaptationScore: number;
}

export type SignalDirection = 'long' | 'short' | 'neutral';

export interface Signal {
  id: string;
  strategyId: string;
  timestamp: number;
  direction: SignalDirection;
  strength: number;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  targets: number[];
  timeframe: number;
  rationale: string;
  structuralContext: {
    gammaLevel: number;
    liquiditySupport: number;
    volatilityState: VolatilityRegime;
    dealerFlow: string;
  };
}

// ============================================================================
// RISK MANAGEMENT
// ============================================================================

export interface RiskMetrics {
  correlation: number;
  gammaExposure: number;
  varContribution: number;
  maxLoss: number;
  marginRequired: number;
}

export interface ExecutionConstraints {
  maxSlippage: number;
  urgency: 'low' | 'medium' | 'high';
  orderType: 'limit' | 'market' | 'stop';
  icebergRatio: number;
  timeInForce: 'day' | 'gtc' | 'ioc' | 'fok';
}

export interface ApprovedSignal {
  originalSignal: Signal;
  approvedSize: number;
  riskMetrics: RiskMetrics;
  executionConstraints: ExecutionConstraints;
  approvalTimestamp: number;
  riskScore: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  stopLoss: number;
  takeProfit: number[];
  entryTime: number;
  strategyId: string;
}

export interface Portfolio {
  positions: Position[];
  totalValue: number;
  cashBalance: number;
  marginUsed: number;
  marginAvailable: number;
  unrealizedPnL: number;
  realizedPnL: number;
  dailyPnL: number;
  maxDrawdown: number;
  currentDrawdown: number;
}

// ============================================================================
// EXECUTION
// ============================================================================

export type OrderStatus = 'pending' | 'submitted' | 'partial' | 'filled' | 'cancelled' | 'rejected';

export interface Order {
  id: string;
  signalId: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market' | 'stop' | 'stop_limit';
  size: number;
  price: number;
  stopPrice?: number;
  status: OrderStatus;
  filledSize: number;
  avgFillPrice: number;
  submittedAt: number;
  filledAt?: number;
  fees: number;
}

export interface ExecutionResult {
  order: Order;
  slippage: number;
  executionTime: number;
  marketImpact: number;
  success: boolean;
  error?: string;
}

// ============================================================================
// LEARNING & MEMORY
// ============================================================================

export interface TradeOutcome {
  tradeId: string;
  signalId: string;
  strategyId: string;
  entryPrice: number;
  exitPrice: number;
  size: number;
  pnl: number;
  pnlPercent: number;
  holdingPeriod: number;
  maxDrawdown: number;
  maxRunup: number;
  structuralFeaturesAtEntry: StructuralFeatures;
  structuralFeaturesAtExit: StructuralFeatures;
  wasCorrectDirection: boolean;
  executionQuality: number;
  timestamp: number;
}

export interface HistoricalPattern {
  id: string;
  timestamp: number;
  structuralFingerprint: number[];
  outcome: TradeOutcome;
  regime: Regime;
  similarity: number;
}

export interface LearningProgress {
  strategyId: string;
  parameterUpdates: Array<{
    parameter: string;
    oldValue: number;
    newValue: number;
    reason: string;
    timestamp: number;
  }>;
  performanceDelta: number;
  adaptationCount: number;
}

export interface StrategyEvolution {
  strategyId: string;
  versions: Array<{
    version: number;
    parameters: Record<string, number>;
    performance: StrategyPerformance;
    timestamp: number;
  }>;
  currentVersion: number;
}

// ============================================================================
// SYSTEM STATE
// ============================================================================

export interface VisualizationData {
  gammaSurfaceGeometry: Float32Array;
  liquidityParticles: Float32Array;
  priceThreadPoints: Float32Array;
  attentionHeatmap: number[][];
  animations: {
    pulseFrequency: number;
    flowSpeed: number;
    glowIntensity: number;
  };
  coherenceWaveform: {
    points: Array<{ x: number; y: number }>;
    resonanceRings: Array<{
      x: number;
      y: number;
      radius: number;
      alpha: number;
    }>;
  };
  regimeIndicator: {
    angle: number;
    magnitude: number;
    color: string;
  };
}

export interface SystemState {
  structuralFeatures: StructuralFeatures;
  regime: Regime;
  coherenceScore: CoherenceScore;
  activeStrategies: ActiveStrategy[];
  signals: Signal[];
  filteredSignals: ApprovedSignal[];
  executionResults: ExecutionResult[];
  visualizationData: VisualizationData;
  portfolio: Portfolio;
  recentTrades: TradeOutcome[];
  learningProgress: LearningProgress[];
  strategyEvolution: StrategyEvolution[];
  timestamp: number;
  systemHealth: {
    dataLatency: number;
    processingTime: number;
    memoryUsage: number;
    errorRate: number;
  };
}

// ============================================================================
// EVENT TYPES
// ============================================================================

export type SystemEvent =
  | { type: 'MARKET_UPDATE'; payload: MarketData }
  | { type: 'STRATEGY_UPDATE'; payload: ActiveStrategy[] }
  | { type: 'SIGNAL_GENERATED'; payload: Signal }
  | { type: 'SIGNAL_APPROVED'; payload: ApprovedSignal }
  | { type: 'EXECUTION_UPDATE'; payload: ExecutionResult }
  | { type: 'LEARNING_UPDATE'; payload: LearningProgress }
  | { type: 'REGIME_CHANGE'; payload: Regime }
  | { type: 'COHERENCE_UPDATE'; payload: CoherenceScore }
  | { type: 'PORTFOLIO_UPDATE'; payload: Portfolio }
  | { type: 'ERROR'; payload: { message: string; code: string } };

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface CircularBuffer<T> {
  capacity: number;
  items: T[];
  add(item: T): void;
  getRecent(n: number): T[];
  average(): number;
  toArray(): T[];
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Color {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface UserAttention {
  x: number;
  y: number;
  focus: 'gamma' | 'liquidity' | 'volatility' | 'signals' | 'portfolio';
  zoomLevel: number;
}

export type InteractionMode = 'explore' | 'analyze' | 'trade' | 'backtest';
