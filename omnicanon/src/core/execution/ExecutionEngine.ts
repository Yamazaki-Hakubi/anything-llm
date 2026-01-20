/**
 * Execution Engine
 * Order routing and slippage prediction
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  ApprovedSignal,
  Order,
  OrderStatus,
  ExecutionResult,
  StructuralFeatures,
} from '../types';
import { CircularBuffer } from '../../utils/circularBuffer';
import { clamp, mean } from '../../utils/math';

interface ExecutionStats {
  totalOrders: number;
  filledOrders: number;
  cancelledOrders: number;
  rejectedOrders: number;
  averageSlippage: number;
  averageExecutionTime: number;
}

export class ExecutionEngine {
  private pendingOrders: Map<string, Order> = new Map();
  private executionHistory: CircularBuffer<ExecutionResult>;
  private slippageHistory: CircularBuffer<number>;
  private stats: ExecutionStats;

  constructor() {
    this.executionHistory = new CircularBuffer(1000);
    this.slippageHistory = new CircularBuffer(100);
    this.stats = {
      totalOrders: 0,
      filledOrders: 0,
      cancelledOrders: 0,
      rejectedOrders: 0,
      averageSlippage: 0,
      averageExecutionTime: 0,
    };
  }

  async execute(
    approvedSignals: ApprovedSignal[],
    structuralFeatures?: StructuralFeatures
  ): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];

    for (const signal of approvedSignals) {
      const result = await this.executeSignal(signal, structuralFeatures);
      results.push(result);
      this.executionHistory.add(result);
      this.updateStats(result);
    }

    return results;
  }

  private async executeSignal(
    signal: ApprovedSignal,
    structuralFeatures?: StructuralFeatures
  ): Promise<ExecutionResult> {
    const startTime = Date.now();

    // Create order
    const order = this.createOrder(signal);
    this.pendingOrders.set(order.id, order);

    try {
      // Predict slippage
      const predictedSlippage = this.predictSlippage(signal, structuralFeatures);

      // Simulate execution (in real system, this would call broker API)
      const executedOrder = await this.simulateExecution(order, signal, predictedSlippage);

      // Calculate actual slippage
      const actualSlippage = this.calculateActualSlippage(order, executedOrder);
      this.slippageHistory.add(actualSlippage);

      // Calculate market impact
      const marketImpact = this.estimateMarketImpact(executedOrder, structuralFeatures);

      const executionTime = Date.now() - startTime;

      // Remove from pending
      this.pendingOrders.delete(order.id);

      return {
        order: executedOrder,
        slippage: actualSlippage,
        executionTime,
        marketImpact,
        success: executedOrder.status === 'filled',
      };
    } catch (error) {
      // Handle execution error
      const failedOrder: Order = {
        ...order,
        status: 'rejected',
      };

      this.pendingOrders.delete(order.id);

      return {
        order: failedOrder,
        slippage: 0,
        executionTime: Date.now() - startTime,
        marketImpact: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
      };
    }
  }

  private createOrder(signal: ApprovedSignal): Order {
    const { originalSignal, approvedSize, executionConstraints } = signal;

    return {
      id: uuidv4(),
      signalId: originalSignal.id,
      symbol: 'SPY', // Placeholder - would come from signal context
      side: originalSignal.direction === 'long' ? 'buy' : 'sell',
      type: executionConstraints.orderType,
      size: approvedSize / originalSignal.entryPrice, // Convert to shares
      price: originalSignal.entryPrice,
      status: 'pending',
      filledSize: 0,
      avgFillPrice: 0,
      submittedAt: Date.now(),
      fees: 0,
    };
  }

  private predictSlippage(
    signal: ApprovedSignal,
    structuralFeatures?: StructuralFeatures
  ): number {
    // Base slippage from historical
    const baseSlippage = this.slippageHistory.average() || 0.001;

    // Adjust for order size relative to liquidity
    let sizeAdjustment = 1;
    if (structuralFeatures) {
      const liquidity = structuralFeatures.liquidityMap.depth;
      const orderValue = signal.approvedSize;
      sizeAdjustment = 1 + (orderValue / (liquidity + 1)) * 0.5;
    }

    // Adjust for volatility
    let volAdjustment = 1;
    if (structuralFeatures) {
      const vol = structuralFeatures.volatilityRegime.impliedVol;
      volAdjustment = 1 + vol / 100;
    }

    // Adjust for urgency
    const urgencyMultiplier =
      signal.executionConstraints.urgency === 'high'
        ? 1.5
        : signal.executionConstraints.urgency === 'medium'
        ? 1.2
        : 1.0;

    return baseSlippage * sizeAdjustment * volAdjustment * urgencyMultiplier;
  }

  private async simulateExecution(
    order: Order,
    signal: ApprovedSignal,
    predictedSlippage: number
  ): Promise<Order> {
    // Simulate network/exchange latency
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10));

    // Simulate fill based on order type
    const fillRate = this.simulateFillRate(order, signal);

    if (fillRate === 0) {
      return {
        ...order,
        status: 'cancelled',
      };
    }

    // Calculate fill price with slippage
    const slippageDirection = order.side === 'buy' ? 1 : -1;
    const actualSlippage = predictedSlippage * (0.5 + Math.random()); // Random around prediction
    const fillPrice = order.price * (1 + slippageDirection * actualSlippage);

    // Calculate fees (simplified)
    const fees = order.size * fillPrice * 0.0001; // 1 bp

    return {
      ...order,
      status: fillRate === 1 ? 'filled' : 'partial',
      filledSize: order.size * fillRate,
      avgFillPrice: fillPrice,
      filledAt: Date.now(),
      fees,
    };
  }

  private simulateFillRate(order: Order, signal: ApprovedSignal): number {
    // Market orders always fill
    if (order.type === 'market') {
      return 1;
    }

    // Limit orders depend on price and urgency
    const maxSlippage = signal.executionConstraints.maxSlippage;
    const randomFactor = Math.random();

    // Higher urgency = more aggressive pricing = higher fill rate
    if (signal.executionConstraints.urgency === 'high') {
      return randomFactor > 0.1 ? 1 : 0.8;
    } else if (signal.executionConstraints.urgency === 'medium') {
      return randomFactor > 0.2 ? 1 : randomFactor > 0.4 ? 0.7 : 0;
    } else {
      return randomFactor > 0.4 ? 1 : randomFactor > 0.6 ? 0.5 : 0;
    }
  }

  private calculateActualSlippage(originalOrder: Order, executedOrder: Order): number {
    if (executedOrder.filledSize === 0) {
      return 0;
    }

    const slippage =
      (executedOrder.avgFillPrice - originalOrder.price) / originalOrder.price;

    // Adjust sign based on side
    return originalOrder.side === 'buy' ? slippage : -slippage;
  }

  private estimateMarketImpact(
    order: Order,
    structuralFeatures?: StructuralFeatures
  ): number {
    if (order.filledSize === 0) {
      return 0;
    }

    // Simple square-root model for market impact
    const orderValue = order.filledSize * order.avgFillPrice;

    // Base impact
    let baseImpact = Math.sqrt(orderValue / 1000000) * 0.0001; // 1bp per $1M sqrt

    // Adjust for liquidity
    if (structuralFeatures) {
      const liquidityRatio = orderValue / (structuralFeatures.liquidityMap.depth + 1);
      baseImpact *= 1 + liquidityRatio;
    }

    return baseImpact;
  }

  private updateStats(result: ExecutionResult): void {
    this.stats.totalOrders++;

    if (result.order.status === 'filled') {
      this.stats.filledOrders++;
    } else if (result.order.status === 'cancelled') {
      this.stats.cancelledOrders++;
    } else if (result.order.status === 'rejected') {
      this.stats.rejectedOrders++;
    }

    // Update averages
    this.stats.averageSlippage = this.slippageHistory.average();

    const execTimes = this.executionHistory.map((r) => r.executionTime);
    this.stats.averageExecutionTime = mean(execTimes);
  }

  cancelOrder(orderId: string): boolean {
    const order = this.pendingOrders.get(orderId);
    if (!order) {
      return false;
    }

    if (order.status === 'pending' || order.status === 'submitted') {
      order.status = 'cancelled';
      this.pendingOrders.delete(orderId);
      this.stats.cancelledOrders++;
      return true;
    }

    return false;
  }

  cancelAllPendingOrders(): number {
    let cancelled = 0;
    for (const [orderId, order] of this.pendingOrders) {
      if (order.status === 'pending' || order.status === 'submitted') {
        order.status = 'cancelled';
        cancelled++;
      }
    }
    this.pendingOrders.clear();
    this.stats.cancelledOrders += cancelled;
    return cancelled;
  }

  getPendingOrders(): Order[] {
    return Array.from(this.pendingOrders.values());
  }

  getExecutionHistory(): ExecutionResult[] {
    return this.executionHistory.toArray();
  }

  getStats(): ExecutionStats {
    return { ...this.stats };
  }

  getRecentSlippage(): number[] {
    return this.slippageHistory.toArray();
  }

  getFillRate(): number {
    if (this.stats.totalOrders === 0) return 0;
    return this.stats.filledOrders / this.stats.totalOrders;
  }

  resetStats(): void {
    this.stats = {
      totalOrders: 0,
      filledOrders: 0,
      cancelledOrders: 0,
      rejectedOrders: 0,
      averageSlippage: 0,
      averageExecutionTime: 0,
    };
  }
}

export default ExecutionEngine;
