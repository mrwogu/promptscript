import { useState, useEffect, useRef, useCallback } from 'react';
import type { FileWatchEvent } from './types';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface ServerConfig {
  mode: 'readwrite' | 'readonly';
  workspace: string;
}

interface UseServerConnectionResult {
  status: ConnectionStatus;
  serverHost: string | null;
  config: ServerConfig | null;
  error: string | null;
  connect: (host: string) => Promise<void>;
  disconnect: () => void;
  onFileEvent: (handler: (event: FileWatchEvent) => void) => void;
}

export function useServerConnection(): UseServerConnectionResult {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [serverHost, setServerHost] = useState<string | null>(null);
  const [config, setConfig] = useState<ServerConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const fileEventHandlerRef = useRef<((event: FileWatchEvent) => void) | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const hostRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const connectWebSocket = useCallback((host: string) => {
    const protocol = host.endsWith(':443') ? 'wss' : 'ws';
    const ws = new WebSocket(`${protocol}://${host}/ws`);

    ws.onopen = () => {
      setStatus('connected');
      reconnectAttemptRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as FileWatchEvent;
        fileEventHandlerRef.current?.(data);
      } catch {
        // Ignore malformed messages
      }
    };

    ws.onclose = () => {
      if (hostRef.current) {
        setStatus('reconnecting');
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptRef.current), 30000);
        reconnectAttemptRef.current++;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket(host);
        }, delay);
      }
    };

    wsRef.current = ws;
  }, []);

  const connect = useCallback(
    async (host: string) => {
      cleanup();
      setStatus('connecting');
      setError(null);
      hostRef.current = host;
      setServerHost(host);

      try {
        const protocol = host.endsWith(':443') ? 'https' : 'http';
        const healthRes = await fetch(`${protocol}://${host}/api/health`);
        if (!healthRes.ok) throw new Error('Health check failed');

        const configRes = await fetch(`${protocol}://${host}/api/config`);
        if (!configRes.ok) throw new Error('Config fetch failed');
        const serverConfig = (await configRes.json()) as ServerConfig;
        setConfig(serverConfig);

        connectWebSocket(host);
      } catch {
        setStatus('disconnected');
        setServerHost(null);
        hostRef.current = null;
        setConfig(null);
        setError(`Could not connect to ${host}. Is the server running?`);
      }
    },
    [cleanup, connectWebSocket]
  );

  const disconnect = useCallback(() => {
    hostRef.current = null;
    cleanup();
    setStatus('disconnected');
    setServerHost(null);
    setConfig(null);
    setError(null);
  }, [cleanup]);

  const onFileEvent = useCallback((handler: (event: FileWatchEvent) => void) => {
    fileEventHandlerRef.current = handler;
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return { status, serverHost, config, error, connect, disconnect, onFileEvent };
}
