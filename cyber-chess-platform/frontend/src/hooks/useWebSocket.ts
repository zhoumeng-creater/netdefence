import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { message } from 'antd';
import { useAppSelector } from '@/store';
import { SocketEvent, GameSocketEvent } from '@/types';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  namespace?: string;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: Error | null;
  lastPing: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = import.meta.env.VITE_WS_URL || 'http://localhost:5000',
    autoConnect = true,
    reconnection = true,
    reconnectionAttempts = 5,
    reconnectionDelay = 1000,
    namespace = '/',
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastPing: 0,
  });

  const { user, token } = useAppSelector(state => state.auth);
  const eventHandlersRef = useRef<Map<string, Set<Function>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const pingIntervalRef = useRef<NodeJS.Timeout>();

  // 初始化Socket连接
  const initSocket = useCallback(() => {
    if (socketRef.current?.connected) return;

    setState(prev => ({ ...prev, connecting: true, error: null }));

    const socket = io(url + namespace, {
      transports: ['websocket', 'polling'],
      reconnection,
      reconnectionAttempts,
      reconnectionDelay,
      auth: {
        token: token?.accessToken,
        userId: user?.id,
      },
    });

    // 连接成功
    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
      setState(prev => ({ ...prev, connected: true, connecting: false }));
      message.success('实时连接已建立');
      
      // 开始心跳检测
      startPing();
    });

    // 连接断开
    socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      setState(prev => ({ ...prev, connected: false }));
      message.warning('实时连接已断开');
      
      // 停止心跳检测
      stopPing();
      
      // 如果是服务器主动断开，尝试重连
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    // 连接错误
    socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setState(prev => ({ 
        ...prev, 
        connecting: false, 
        error: new Error(error.message) 
      }));
      
      if (error.message === 'Authentication failed') {
        message.error('认证失败，请重新登录');
      }
    });

    // 重连尝试
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      message.info(`正在尝试重新连接... (${attemptNumber}/${reconnectionAttempts})`);
    });

    // 重连失败
    socket.on('reconnect_failed', () => {
      console.error('WebSocket reconnection failed');
      setState(prev => ({ ...prev, error: new Error('重连失败') }));
      message.error('无法建立实时连接，请刷新页面重试');
    });

    // Ping/Pong心跳
    socket.on('pong', (latency: number) => {
      setState(prev => ({ ...prev, lastPing: latency }));
    });

    socketRef.current = socket;
    return socket;
  }, [url, namespace, reconnection, reconnectionAttempts, reconnectionDelay, token, user]);

  // 心跳检测
  const startPing = useCallback(() => {
    if (pingIntervalRef.current) return;
    
    pingIntervalRef.current = setInterval(() => {
      if (socketRef.current?.connected) {
        const start = Date.now();
        socketRef.current.emit('ping', () => {
          const latency = Date.now() - start;
          setState(prev => ({ ...prev, lastPing: latency }));
        });
      }
    }, 30000); // 每30秒发送一次心跳
  }, []);

  const stopPing = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = undefined;
    }
  }, []);

  // 连接管理
  const connect = useCallback(() => {
    if (!socketRef.current) {
      initSocket();
    } else if (!socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, [initSocket]);

  const disconnect = useCallback(() => {
    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
      stopPing();
    }
  }, [stopPing]);

  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      connect();
    }, reconnectionDelay);
  }, [connect, disconnect, reconnectionDelay]);

  // 事件管理
  const on = useCallback((event: string, handler: Function) => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)!.add(handler);
    
    socketRef.current?.on(event, handler as any);
    
    // 返回取消订阅函数
    return () => off(event, handler);
  }, []);

  const off = useCallback((event: string, handler?: Function) => {
    if (handler) {
      eventHandlersRef.current.get(event)?.delete(handler);
      socketRef.current?.off(event, handler as any);
    } else {
      eventHandlersRef.current.delete(event);
      socketRef.current?.off(event);
    }
  }, []);

  const once = useCallback((event: string, handler: Function) => {
    socketRef.current?.once(event, handler as any);
  }, []);

  const emit = useCallback((event: string, data?: any, callback?: Function) => {
    if (!socketRef.current?.connected) {
      console.warn('Socket not connected, queuing event:', event);
      // 可以实现一个事件队列，在连接后发送
      return false;
    }
    
    if (callback) {
      socketRef.current.emit(event, data, callback);
    } else {
      socketRef.current.emit(event, data);
    }
    return true;
  }, []);

  // 房间管理
  const joinRoom = useCallback((room: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }
      
      socketRef.current.emit('join-room', room, (response: any) => {
        if (response.success) {
          message.success(`已加入房间: ${room}`);
          resolve();
        } else {
          message.error(response.message || '加入房间失败');
          reject(new Error(response.message));
        }
      });
    });
  }, []);

  const leaveRoom = useCallback((room: string) => {
    return new Promise<void>((resolve, reject) => {
      if (!socketRef.current?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }
      
      socketRef.current.emit('leave-room', room, (response: any) => {
        if (response.success) {
          message.success(`已离开房间: ${room}`);
          resolve();
        } else {
          message.error(response.message || '离开房间失败');
          reject(new Error(response.message));
        }
      });
    });
  }, []);

  // 游戏相关事件
  const sendGameMove = useCallback((gameId: string, move: any) => {
    const event: GameSocketEvent = {
      type: 'game:move',
      gameId,
      playerId: user?.id || '',
      payload: move,
      timestamp: new Date().toISOString(),
    };
    return emit('game:move', event);
  }, [emit, user]);

  const sendGameChat = useCallback((gameId: string, message: string) => {
    const event: GameSocketEvent = {
      type: 'game:chat',
      gameId,
      playerId: user?.id || '',
      payload: { message },
      timestamp: new Date().toISOString(),
    };
    return emit('game:chat', event);
  }, [emit, user]);

  // 生命周期管理
  useEffect(() => {
    if (autoConnect && user && token) {
      connect();
    }

    return () => {
      if (socketRef.current) {
        stopPing();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [autoConnect, user, token, connect, stopPing]);

  return {
    // 状态
    socket: socketRef.current,
    connected: state.connected,
    connecting: state.connecting,
    error: state.error,
    latency: state.lastPing,
    
    // 连接管理
    connect,
    disconnect,
    reconnect,
    
    // 事件管理
    on,
    off,
    once,
    emit,
    
    // 房间管理
    joinRoom,
    leaveRoom,
    
    // 游戏相关
    sendGameMove,
    sendGameChat,
  };
};