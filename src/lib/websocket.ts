import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

interface WebSocketConfig {
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  maxReconnectDelay?: number;
  backoffMultiplier?: number;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

// WebSocket Manager class
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig & { url: string };
  private reconnectAttempts = 0;
  private reconnectTimeoutId: NodeJS.Timeout | null = null;
  private heartbeatIntervalId: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isManualClose = false;

  constructor(url: string, config: WebSocketConfig = {}) {
    this.config = {
      url,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      maxReconnectDelay: 30000,
      backoffMultiplier: 2,
      enableHeartbeat: true,
      heartbeatInterval: 30000,
      ...config
    };
  }

  connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.isManualClose = false;

    try {
      this.ws = new WebSocket(this.config.url);      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.config.onOpen?.();
      };      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.stopHeartbeat();
        this.config.onClose?.();
        
        if (!this.isManualClose && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        this.isConnecting = false;
        this.config.onError?.(error);
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
      // Create a mock CloseEvent for the error callback
      const errorEvent = new CloseEvent('error', {
        code: 1006,
        reason: 'Connection failed',
        wasClean: false
      });
      this.config.onError?.(errorEvent);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
    }

    const delay = Math.min(
      this.config.reconnectDelay! * Math.pow(this.config.backoffMultiplier!, this.reconnectAttempts),
      this.config.maxReconnectDelay!
    );    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    if (this.config.enableHeartbeat && this.config.heartbeatInterval) {
      this.heartbeatIntervalId = setInterval(() => {
        if (this.ws?.readyState === WebSocket.OPEN) {
          this.send({
            type: 'ping',
            payload: {},
            timestamp: Date.now()
          });
        }
      }, this.config.heartbeatInterval);
    }
  }

  private stopHeartbeat(): void {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    if (message.type === 'pong') {
      return; // Handle heartbeat response
    }

    this.config.onMessage?.(message);
  }

  send(message: WebSocketMessage): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
        return false;
      }
    }
    return false;
  }

  disconnect(): void {
    this.isManualClose = true;
    
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getState(): 'connecting' | 'connected' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }
}

// Socket.IO Manager for real-time features
export class SocketIOManager {
  private socket: Socket | null = null;
  private connected = false;

  constructor(private url: string) {}

  connect(): void {
    if (this.socket) return;

    this.socket = io(this.url, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });    this.socket.on('connect', () => {
      this.connected = true;
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  emit(event: string, ...args: any[]): void {
    if (this.socket && this.connected) {
      this.socket.emit(event, ...args);
    }
  }

  on(event: string, callback: (...args: any[]) => void): () => void {
    if (this.socket) {
      this.socket.on(event, callback);
      return () => this.socket?.off(event, callback);
    }
    return () => {};
  }

  // Tournament room methods
  joinTournament(tournamentId: string): void {
    this.emit('join-tournament', tournamentId);
  }

  leaveTournament(tournamentId: string): void {
    this.emit('leave-tournament', tournamentId);
  }

  // Match room methods
  joinMatch(matchId: string): void {
    this.emit('join-match', matchId);
  }

  leaveMatch(matchId: string): void {
    this.emit('leave-match', matchId);
  }

  // Real-time event handlers
  onTournamentUpdate(callback: (data: any) => void): () => void {
    return this.on('tournament-updated', callback);
  }

  onMatchUpdate(callback: (data: any) => void): () => void {
    return this.on('match-updated', callback);
  }

  onUserJoined(callback: (data: any) => void): () => void {
    return this.on('user-joined', callback);
  }

  onUserLeft(callback: (data: any) => void): () => void {
    return this.on('user-left', callback);
  }
}

// React hooks for WebSocket
export function useWebSocket(url: string, config?: Partial<WebSocketConfig>) {
  const [state, setState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const managerRef = useRef<WebSocketManager | null>(null);

  useEffect(() => {
    const manager = new WebSocketManager(url, {
      ...config,
      onOpen: () => {
        setState('connected');
        config?.onOpen?.();
      },
      onClose: () => {
        setState('disconnected');
        config?.onClose?.();
      },
      onMessage: (message) => {
        setLastMessage(message);
        config?.onMessage?.(message);
      },
      onError: config?.onError
    });

    managerRef.current = manager;
    manager.connect();

    return () => {
      manager.disconnect();
    };
  }, [url]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    return managerRef.current?.send(message) || false;
  }, []);

  return {
    state,
    lastMessage,
    sendMessage,
    disconnect: () => managerRef.current?.disconnect()
  };
}

// React hooks for Socket.IO
export function useSocketIO(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const socketManager = useRef<SocketIOManager | null>(null);

  useEffect(() => {
    const manager = new SocketIOManager(url);
    socketManager.current = manager;
    
    manager.connect();

    // Set up connection state tracking
    const checkConnection = () => {
      setIsConnected(manager.isConnected());
    };

    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => {
      clearInterval(interval);
      manager.disconnect();
    };
  }, [url]);

  return {
    isConnected,
    manager: socketManager.current,
    joinTournament: (tournamentId: string) => 
      socketManager.current?.joinTournament(tournamentId),
    leaveTournament: (tournamentId: string) => 
      socketManager.current?.leaveTournament(tournamentId),
    joinMatch: (matchId: string) => 
      socketManager.current?.joinMatch(matchId),
    leaveMatch: (matchId: string) => 
      socketManager.current?.leaveMatch(matchId),
    onTournamentUpdate: (callback: (data: any) => void) => 
      socketManager.current?.onTournamentUpdate(callback) || (() => {}),
    onMatchUpdate: (callback: (data: any) => void) => 
      socketManager.current?.onMatchUpdate(callback) || (() => {}),
    on: (event: string, callback: (...args: any[]) => void) => 
      socketManager.current?.on(event, callback) || (() => {}),
    emit: (event: string, ...args: any[]) => 
      socketManager.current?.emit(event, ...args)
  };
}

// Default exports
export default {
  WebSocketManager,
  SocketIOManager,
  useWebSocket,
  useSocketIO
};
