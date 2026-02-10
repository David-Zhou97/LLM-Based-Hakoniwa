import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  emit: (event: string, data?: unknown) => void;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  off: (event: string, handler: (...args: unknown[]) => void) => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to NIWA server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from NIWA server');
      setConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
  }, []);

  const off = useCallback((event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler);
  }, []);

  return {
    socket: socketRef.current,
    connected,
    emit,
    on,
    off,
  };
}
