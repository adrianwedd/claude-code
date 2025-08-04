'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '@/types';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  error: string | null;
  reconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  error: null,
  reconnect: () => {},
});

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = () => {
    if (socket?.connected) return;

    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      setError(null);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        setTimeout(() => connect(), 1000);
      }
    });

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err);
      setError(`Connection failed: ${err.message}`);
      setIsConnected(false);
    });

    newSocket.on('error', (err) => {
      console.error('WebSocket error:', err);
      setError(`Socket error: ${err}`);
    });

    // Handle incoming messages
    newSocket.on('message', (data: WebSocketMessage) => {
      console.log('Received message:', data);
      // Emit to specific handlers based on message type
      switch (data.type) {
        case 'chat':
          newSocket.emit('chat_message', data.payload);
          break;
        case 'tool_use':
          newSocket.emit('tool_use', data.payload);
          break;
        case 'file_update':
          newSocket.emit('file_update', data.payload);
          break;
        case 'system_status':
          newSocket.emit('system_status', data.payload);
          break;
        case 'error':
          newSocket.emit('error', data.payload);
          break;
        default:
          console.warn('Unknown message type:', data.type);
      }
    });

    setSocket(newSocket);
  };

  const reconnect = () => {
    if (socket) {
      socket.disconnect();
    }
    setTimeout(() => connect(), 100);
  };

  useEffect(() => {
    connect();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Automatic reconnection logic
  useEffect(() => {
    if (!isConnected && !error) {
      const reconnectInterval = setInterval(() => {
        if (!socket?.connected) {
          console.log('Attempting to reconnect...');
          connect();
        }
      }, 5000);

      return () => clearInterval(reconnectInterval);
    }
  }, [isConnected, error, socket]);

  const value: SocketContextType = {
    socket,
    isConnected,
    error,
    reconnect,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}