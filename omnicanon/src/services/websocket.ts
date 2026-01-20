/**
 * WebSocket Service
 * Real-time data streaming and connection management
 */

import type { SystemEvent, MarketData } from '../core/types';

type MessageHandler = (event: SystemEvent) => void;
type ConnectionHandler = () => void;
type ErrorHandler = (error: Event) => void;

interface WebSocketConfig {
  url: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketConfig>;
  private reconnectCount = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private connectHandlers: Set<ConnectionHandler> = new Set();
  private disconnectHandlers: Set<ConnectionHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();
  private isConnecting = false;
  private shouldReconnect = true;
  private subscriptions: string[] = [];

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectAttempts: 10,
      reconnectDelay: 1000,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    try {
      this.ws = new WebSocket(this.config.url);
      this.setupEventHandlers();
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private setupEventHandlers(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectCount = 0;

      // Start heartbeat
      this.startHeartbeat();

      // Resubscribe to channels
      this.resubscribe();

      // Notify handlers
      this.connectHandlers.forEach((handler) => handler());
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.errorHandlers.forEach((handler) => handler(error));
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      this.isConnecting = false;
      this.stopHeartbeat();

      // Notify handlers
      this.disconnectHandlers.forEach((handler) => handler());

      // Attempt reconnect
      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    };
  }

  private handleMessage(data: unknown): void {
    // Handle system messages
    if (typeof data === 'object' && data !== null && 'type' in data) {
      const message = data as { type: string; payload?: unknown };

      // Handle pong response
      if (message.type === 'pong') {
        return;
      }

      // Convert to SystemEvent and dispatch
      const event = this.convertToSystemEvent(message);
      if (event) {
        this.messageHandlers.forEach((handler) => handler(event));
      }
    }
  }

  private convertToSystemEvent(message: { type: string; payload?: unknown }): SystemEvent | null {
    switch (message.type) {
      case 'market_update':
        return { type: 'MARKET_UPDATE', payload: message.payload as MarketData };
      case 'strategy_update':
        return { type: 'STRATEGY_UPDATE', payload: message.payload as SystemEvent['payload'] };
      case 'signal_generated':
        return { type: 'SIGNAL_GENERATED', payload: message.payload as SystemEvent['payload'] };
      case 'execution_update':
        return { type: 'EXECUTION_UPDATE', payload: message.payload as SystemEvent['payload'] };
      case 'learning_update':
        return { type: 'LEARNING_UPDATE', payload: message.payload as SystemEvent['payload'] };
      case 'error':
        return { type: 'ERROR', payload: message.payload as { message: string; code: string } };
      default:
        console.warn('Unknown message type:', message.type);
        return null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectCount >= this.config.reconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = this.config.reconnectDelay * Math.pow(2, this.reconnectCount);
    this.reconnectCount++;

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectCount})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping', timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private resubscribe(): void {
    for (const channel of this.subscriptions) {
      this.send({ type: 'subscribe', channel });
    }
  }

  send(message: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }

  subscribe(channel: string): void {
    if (!this.subscriptions.includes(channel)) {
      this.subscriptions.push(channel);
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'subscribe', channel });
    }
  }

  unsubscribe(channel: string): void {
    const index = this.subscriptions.indexOf(channel);
    if (index > -1) {
      this.subscriptions.splice(index, 1);
    }

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.send({ type: 'unsubscribe', channel });
    }
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnect(handler: ConnectionHandler): () => void {
    this.connectHandlers.add(handler);
    return () => this.connectHandlers.delete(handler);
  }

  onDisconnect(handler: ConnectionHandler): () => void {
    this.disconnectHandlers.add(handler);
    return () => this.disconnectHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

export default WebSocketService;
