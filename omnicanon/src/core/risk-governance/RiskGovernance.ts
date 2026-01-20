/**
 * Risk Governance
 * Position sizing, correlation checking, and kill switch management
 */

import type {
  Signal,
  ApprovedSignal,
  Portfolio,
  Position,
  StructuralFeatures,
  RiskMetrics,
  ExecutionConstraints,
} from '../types';
import { clamp, correlation, kellyCriterion, standardDeviation } from '../../utils/math';

interface RiskLimits {
  maxPositionSize: number;
  maxPortfolioRisk: number;
  maxCorrelation: number;
  maxDrawdown: number;
  maxDailyLoss: number;
  maxConcentration: number;
}

export class RiskGovernance {
  private limits: RiskLimits;
  private killSwitchActive = false;
  private killSwitchReason = '';
  private dailyPnL = 0;
  private peakEquity = 0;

  constructor(limits?: Partial<RiskLimits>) {
    this.limits = {
      maxPositionSize: 0.1, // 10% of portfolio per position
      maxPortfolioRisk: 0.02, // 2% total portfolio risk at any time
      maxCorrelation: 0.7, // Max correlation between positions
      maxDrawdown: 0.15, // 15% max drawdown before kill switch
      maxDailyLoss: 0.05, // 5% max daily loss
      maxConcentration: 0.3, // 30% max in any single asset
      ...limits,
    };
  }

  filterSignals(
    signals: Signal[],
    portfolio: Portfolio,
    structuralFeatures: StructuralFeatures
  ): ApprovedSignal[] {
    // Check kill switch first
    if (this.killSwitchActive) {
      console.warn(`Risk governance kill switch active: ${this.killSwitchReason}`);
      return [];
    }

    // Update risk state
    this.updateRiskState(portfolio);

    // Check global risk limits
    if (!this.checkGlobalRiskLimits(portfolio)) {
      return [];
    }

    const approved: ApprovedSignal[] = [];

    for (const signal of signals) {
      // Calculate position size
      const positionSize = this.calculatePositionSize(
        signal,
        portfolio,
        structuralFeatures
      );

      if (positionSize <= 0) {
        continue;
      }

      // Calculate risk metrics
      const riskMetrics = this.calculateRiskMetrics(signal, portfolio);

      // Check correlation with existing positions
      if (riskMetrics.correlation > this.limits.maxCorrelation) {
        continue;
      }

      // Check gamma exposure
      const maxGammaExposure = portfolio.totalValue * 0.01;
      if (Math.abs(riskMetrics.gammaExposure) > maxGammaExposure) {
        continue;
      }

      // Determine execution constraints
      const executionConstraints = this.determineExecutionConstraints(
        signal,
        structuralFeatures
      );

      // Calculate risk score
      const riskScore = this.calculateRiskScore(riskMetrics, structuralFeatures);

      const approvedSignal: ApprovedSignal = {
        originalSignal: signal,
        approvedSize: positionSize,
        riskMetrics,
        executionConstraints,
        approvalTimestamp: Date.now(),
        riskScore,
      };

      approved.push(approvedSignal);
    }

    // Apply portfolio-level constraints
    return this.applyPortfolioConstraints(approved, portfolio);
  }

  private calculatePositionSize(
    signal: Signal,
    portfolio: Portfolio,
    structuralFeatures: StructuralFeatures
  ): number {
    // Base size from Kelly criterion
    const estimatedWinRate = signal.confidence;
    const avgWin = Math.abs(signal.targets[0] - signal.entryPrice) / signal.entryPrice;
    const avgLoss = Math.abs(signal.entryPrice - signal.stopLoss) / signal.entryPrice;

    let kellyFraction = kellyCriterion(estimatedWinRate, avgWin, avgLoss);
    kellyFraction = clamp(kellyFraction, 0, 0.25); // Max 25% of Kelly

    // Half-Kelly for conservatism
    const halfKelly = kellyFraction / 2;

    // Adjust for volatility regime
    const volMultiplier = this.getVolatilityMultiplier(structuralFeatures);

    // Calculate position value
    const baseSize = portfolio.totalValue * halfKelly * volMultiplier;

    // Apply max position limit
    const maxSize = portfolio.totalValue * this.limits.maxPositionSize;

    // Apply available margin constraint
    const marginRequired = baseSize * 0.5; // Assume 50% margin requirement
    const marginConstrained = Math.min(baseSize, portfolio.marginAvailable / 0.5);

    return Math.min(baseSize, maxSize, marginConstrained);
  }

  private getVolatilityMultiplier(structuralFeatures: StructuralFeatures): number {
    const { regime } = structuralFeatures.volatilityRegime;

    switch (regime) {
      case 'low':
        return 1.2;
      case 'normal':
        return 1.0;
      case 'elevated':
        return 0.8;
      case 'high':
        return 0.5;
      case 'extreme':
        return 0.25;
      default:
        return 1.0;
    }
  }

  private calculateRiskMetrics(signal: Signal, portfolio: Portfolio): RiskMetrics {
    // Calculate correlation with existing positions
    const correlationRisk = this.calculateCorrelationRisk(signal, portfolio);

    // Calculate gamma exposure contribution
    const gammaExposure = signal.structuralContext.gammaLevel * 0.01;

    // Calculate VaR contribution (simplified)
    const signalRisk = Math.abs(signal.entryPrice - signal.stopLoss) / signal.entryPrice;
    const varContribution = signalRisk * signal.confidence;

    // Calculate max potential loss
    const maxLoss = signalRisk;

    // Estimate margin required
    const marginRequired = signal.entryPrice * 0.5;

    return {
      correlation: correlationRisk,
      gammaExposure,
      varContribution,
      maxLoss,
      marginRequired,
    };
  }

  private calculateCorrelationRisk(signal: Signal, portfolio: Portfolio): number {
    if (portfolio.positions.length === 0) {
      return 0;
    }

    // Simplified: check if we already have a position in same direction
    const sameDirectionPositions = portfolio.positions.filter(
      (p) =>
        (p.side === 'long' && signal.direction === 'long') ||
        (p.side === 'short' && signal.direction === 'short')
    );

    const totalSameDirection = sameDirectionPositions.reduce(
      (sum, p) => sum + Math.abs(p.size * p.currentPrice),
      0
    );

    return totalSameDirection / portfolio.totalValue;
  }

  private determineExecutionConstraints(
    signal: Signal,
    structuralFeatures: StructuralFeatures
  ): ExecutionConstraints {
    const { liquidityMap, volatilityRegime } = structuralFeatures;

    // Determine urgency based on signal strength and volatility
    let urgency: ExecutionConstraints['urgency'];
    if (signal.strength > 0.8 && volatilityRegime.regime !== 'extreme') {
      urgency = 'high';
    } else if (signal.strength > 0.5) {
      urgency = 'medium';
    } else {
      urgency = 'low';
    }

    // Determine order type
    let orderType: ExecutionConstraints['orderType'];
    if (urgency === 'high') {
      orderType = 'market';
    } else if (volatilityRegime.regime === 'high' || volatilityRegime.regime === 'extreme') {
      orderType = 'limit';
    } else {
      orderType = 'limit';
    }

    // Calculate max slippage based on volatility and liquidity
    const baseSlippage = 0.001; // 10 bps
    const volAdjustment = volatilityRegime.impliedVol / 100;
    const liquidityAdjustment = 1 / (liquidityMap.depth + 1);
    const maxSlippage = baseSlippage * (1 + volAdjustment + liquidityAdjustment);

    // Iceberg ratio for large orders
    const icebergRatio = signal.strength > 0.7 ? 0.2 : 0.5;

    return {
      maxSlippage,
      urgency,
      orderType,
      icebergRatio,
      timeInForce: urgency === 'high' ? 'ioc' : 'day',
    };
  }

  private calculateRiskScore(
    riskMetrics: RiskMetrics,
    structuralFeatures: StructuralFeatures
  ): number {
    // Lower score = less risky
    let score = 0;

    // Correlation contribution
    score += riskMetrics.correlation * 0.3;

    // Gamma exposure contribution
    score += Math.abs(riskMetrics.gammaExposure) * 0.001 * 0.2;

    // VaR contribution
    score += riskMetrics.varContribution * 0.3;

    // Volatility regime contribution
    const volScore =
      structuralFeatures.volatilityRegime.regime === 'extreme'
        ? 1
        : structuralFeatures.volatilityRegime.regime === 'high'
        ? 0.7
        : structuralFeatures.volatilityRegime.regime === 'elevated'
        ? 0.4
        : 0.2;
    score += volScore * 0.2;

    return clamp(score, 0, 1);
  }

  private applyPortfolioConstraints(
    signals: ApprovedSignal[],
    portfolio: Portfolio
  ): ApprovedSignal[] {
    if (signals.length === 0) return [];

    // Sort by risk score (lower = better)
    signals.sort((a, b) => a.riskScore - b.riskScore);

    const approved: ApprovedSignal[] = [];
    let totalRisk = 0;
    let totalMargin = portfolio.marginUsed;

    for (const signal of signals) {
      // Check if adding this signal exceeds portfolio risk
      const newTotalRisk = totalRisk + signal.riskMetrics.varContribution;
      if (newTotalRisk > this.limits.maxPortfolioRisk) {
        continue;
      }

      // Check margin
      const newMargin = totalMargin + signal.riskMetrics.marginRequired;
      if (newMargin > portfolio.marginAvailable + portfolio.marginUsed) {
        continue;
      }

      approved.push(signal);
      totalRisk = newTotalRisk;
      totalMargin = newMargin;
    }

    return approved;
  }

  private updateRiskState(portfolio: Portfolio): void {
    // Update peak equity
    if (portfolio.totalValue > this.peakEquity) {
      this.peakEquity = portfolio.totalValue;
    }

    // Check drawdown
    const currentDrawdown = (this.peakEquity - portfolio.totalValue) / this.peakEquity;
    if (currentDrawdown > this.limits.maxDrawdown) {
      this.activateKillSwitch(`Max drawdown exceeded: ${(currentDrawdown * 100).toFixed(2)}%`);
    }

    // Check daily loss
    this.dailyPnL = portfolio.dailyPnL;
    if (this.dailyPnL < -this.limits.maxDailyLoss * portfolio.totalValue) {
      this.activateKillSwitch(`Max daily loss exceeded: ${this.dailyPnL.toFixed(2)}`);
    }
  }

  private checkGlobalRiskLimits(portfolio: Portfolio): boolean {
    // Check if we can take new positions
    if (portfolio.marginAvailable < portfolio.totalValue * 0.1) {
      return false;
    }

    // Check concentration
    for (const position of portfolio.positions) {
      const concentration = Math.abs(position.size * position.currentPrice) / portfolio.totalValue;
      if (concentration > this.limits.maxConcentration) {
        return false;
      }
    }

    return true;
  }

  activateKillSwitch(reason: string): void {
    this.killSwitchActive = true;
    this.killSwitchReason = reason;
    console.error(`KILL SWITCH ACTIVATED: ${reason}`);
  }

  deactivateKillSwitch(): void {
    this.killSwitchActive = false;
    this.killSwitchReason = '';
  }

  isKillSwitchActive(): boolean {
    return this.killSwitchActive;
  }

  getKillSwitchReason(): string {
    return this.killSwitchReason;
  }

  resetDailyRisk(): void {
    this.dailyPnL = 0;
    // Only reset kill switch if it was due to daily loss
    if (this.killSwitchReason.includes('daily loss')) {
      this.deactivateKillSwitch();
    }
  }

  updateLimits(newLimits: Partial<RiskLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
  }

  getLimits(): RiskLimits {
    return { ...this.limits };
  }

  getRiskSummary(portfolio: Portfolio): {
    currentDrawdown: number;
    dailyPnL: number;
    utilizationRate: number;
    riskCapacity: number;
  } {
    const currentDrawdown =
      this.peakEquity > 0
        ? (this.peakEquity - portfolio.totalValue) / this.peakEquity
        : 0;

    const utilizationRate =
      portfolio.marginUsed / (portfolio.marginUsed + portfolio.marginAvailable);

    const riskCapacity = 1 - currentDrawdown / this.limits.maxDrawdown;

    return {
      currentDrawdown,
      dailyPnL: this.dailyPnL,
      utilizationRate,
      riskCapacity,
    };
  }
}

export default RiskGovernance;
