import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { io, type Socket } from 'socket.io-client';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface QueuedMessage {
  event: string;
  payload: any;
  callback?: (response: any) => void;
}

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  private readonly url = 'https://chat-app-backend-9clb.onrender.com/ws';
  // private readonly url = 'http://localhost:3000/ws';
  private listeners: Record<string, Array<(payload: any) => void>> = {};
  private queue: QueuedMessage[] = [];
  private reconnectAttempt = 0;
  private readonly maxReconnectAttempts = 10;
  private reconnectTimer: any = null;
  private token = '';

  private readonly connectionStatus = new BehaviorSubject<ConnectionStatus>('disconnected');
  connectionStatus$ = this.connectionStatus.asObservable();

  constructor(private zone: NgZone) {}

  connect(token: string) {
    if (this.socket?.connected) {
      return;
    }

    this.token = token;
    this.reconnectAttempt = 0;
    this.connectionStatus.next('connecting');

    this.socket = io(this.url, {
      auth: { token },
      transports: ['websocket'],
      autoConnect: false,
      reconnection: false,
    });

    this.bindEvents();

    Object.entries(this.listeners).forEach(([event, callbacks]) => {
      callbacks.forEach((cb) => this.socket?.on(event, cb));
    });

    this.socket.connect();
  }

  private bindEvents() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.zone.run(() => {
        this.connectionStatus.next('connected');
        this.reconnectAttempt = 0;
        this.flushQueue();
      });
    });

    this.socket.on('disconnect', (reason: string) => {
      this.zone.run(() => {
        this.connectionStatus.next('disconnected');
        if (reason === 'io server disconnect' || reason === 'io client disconnect') {
          return;
        }
        this.scheduleReconnect();
      });
    });

    this.socket.on('connect_error', () => {
      this.zone.run(() => {
        this.connectionStatus.next('disconnected');
        this.scheduleReconnect();
      });
    });
  }

  private scheduleReconnect() {
    if (this.reconnectAttempt >= this.maxReconnectAttempts) {
      this.connectionStatus.next('disconnected');
      return;
    }

    this.reconnectAttempt++;
    this.connectionStatus.next('reconnecting');

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempt - 1) + Math.random() * 1000, 30000);

    this.reconnectTimer = setTimeout(() => {
      this.socket?.connect();
    }, delay);
  }

  private flushQueue() {
    while (this.queue.length > 0) {
      const msg = this.queue.shift();
      if (msg) {
        this.emit(msg.event, msg.payload, msg.callback);
      }
    }
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.disconnect();
    this.socket = null;
    this.connectionStatus.next('disconnected');
  }

  emit<TResponse = void>(event: string, payload: any, callback?: (response: TResponse) => void) {
    if (!this.socket?.connected) {
      this.queue.push({ event, payload, callback });
      return;
    }

    if (!callback) {
      this.socket.emit(event, payload);
      return;
    }

    this.socket.emit(event, payload, (response: TResponse) => {
      this.zone.run(() => callback(response));
    });
  }

  on<T>(event: string, callback: (payload: T) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    const wrappedCallback = (payload: T) => {
      this.zone.run(() => callback(payload));
    };

    this.listeners[event].push(wrappedCallback);
    this.socket?.on(event, wrappedCallback);
  }

  off(event: string) {
    this.socket?.off(event);
    this.listeners[event] = [];
  }
}
