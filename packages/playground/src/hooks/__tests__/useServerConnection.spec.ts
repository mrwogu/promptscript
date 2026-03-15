import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useServerConnection } from '../useServerConnection';

describe('useServerConnection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts in disconnected state', () => {
    const { result } = renderHook(() => useServerConnection());
    expect(result.current.status).toBe('disconnected');
    expect(result.current.serverHost).toBeNull();
    expect(result.current.config).toBeNull();
  });

  it('connects to a server', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mode: 'readwrite', workspace: '/test' }),
      } as Response);
    vi.stubGlobal('fetch', mockFetch);

    const mockWs = {
      onopen: null as null | (() => void),
      onmessage: null,
      onclose: null as null | (() => void),
      close: vi.fn(),
    };
    function MockWebSocket() {
      return mockWs;
    }
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      await result.current.connect('localhost:3000');
    });

    await act(async () => {
      mockWs.onopen?.();
    });

    expect(result.current.status).toBe('connected');
    expect(result.current.serverHost).toBe('localhost:3000');
    expect(result.current.config?.mode).toBe('readwrite');
  });

  it('returns to disconnected on disconnect', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ ok: true } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ mode: 'readwrite', workspace: '/test' }),
      } as Response);
    vi.stubGlobal('fetch', mockFetch);

    const mockWs2 = {
      onopen: null as null | (() => void),
      onmessage: null,
      onclose: null as null | (() => void),
      close: vi.fn(),
    };
    function MockWebSocket2() {
      return mockWs2;
    }
    vi.stubGlobal('WebSocket', MockWebSocket2);

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      await result.current.connect('localhost:3000');
    });
    await act(async () => {
      mockWs2.onopen?.();
    });

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.serverHost).toBeNull();
  });

  it('stays disconnected when health check fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false } as Response));

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      await result.current.connect('localhost:3000');
    });

    expect(result.current.status).toBe('disconnected');
  });

  it('handles incoming WebSocket messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ mode: 'readwrite', workspace: '/test' }),
        } as Response)
    );

    const mockWs = {
      onopen: null as null | (() => void),
      onmessage: null as null | ((e: { data: string }) => void),
      onclose: null as null | (() => void),
      close: vi.fn(),
    };
    function MockWebSocket() {
      return mockWs;
    }
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { result } = renderHook(() => useServerConnection());

    const handler = vi.fn();
    act(() => {
      result.current.onFileEvent(handler);
    });

    await act(async () => {
      await result.current.connect('localhost:3000');
    });

    await act(async () => {
      mockWs.onopen?.();
    });

    act(() => {
      mockWs.onmessage?.({ data: JSON.stringify({ type: 'file:changed', path: 'test.prs' }) });
    });

    expect(handler).toHaveBeenCalledWith({ type: 'file:changed', path: 'test.prs' });
  });

  it('ignores malformed WebSocket messages', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ mode: 'readwrite', workspace: '/test' }),
        } as Response)
    );

    const mockWs = {
      onopen: null as null | (() => void),
      onmessage: null as null | ((e: { data: string }) => void),
      onclose: null as null | (() => void),
      close: vi.fn(),
    };
    function MockWebSocket() {
      return mockWs;
    }
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      await result.current.connect('localhost:3000');
    });

    await act(async () => {
      mockWs.onopen?.();
    });

    // Should not throw
    act(() => {
      mockWs.onmessage?.({ data: 'not-json' });
    });

    expect(result.current.status).toBe('connected');
  });

  it('reconnects with exponential backoff on WebSocket close', async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ mode: 'readwrite', workspace: '/test' }),
        } as Response)
    );

    const mockWs = {
      onopen: null as null | (() => void),
      onmessage: null as null | ((e: { data: string }) => void),
      onclose: null as null | (() => void),
      close: vi.fn(),
    };
    const MockWebSocket = vi.fn(function () {
      return mockWs;
    });
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      await result.current.connect('localhost:3000');
    });

    await act(async () => {
      mockWs.onopen?.();
    });

    expect(result.current.status).toBe('connected');

    // Simulate WebSocket close while still connected (hostRef is set)
    await act(async () => {
      mockWs.onclose?.();
    });

    expect(result.current.status).toBe('reconnecting');

    // Advance timer to trigger reconnection (1s * 2^0 = 1000ms)
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    // Should have created a second WebSocket
    expect(MockWebSocket).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it('sets disconnected state when connect fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network error')));

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      await result.current.connect('localhost:3000');
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.serverHost).toBeNull();
    expect(result.current.config).toBeNull();
  });

  it('uses wss protocol for port 443', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce({ ok: true } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ mode: 'readwrite', workspace: '/test' }),
        } as Response)
    );

    const mockWs = {
      onopen: null as null | (() => void),
      onmessage: null as null | (() => void),
      onclose: null as null | (() => void),
      close: vi.fn(),
    };
    const MockWebSocket = vi.fn(function () {
      return mockWs;
    });
    vi.stubGlobal('WebSocket', MockWebSocket);

    const { result } = renderHook(() => useServerConnection());

    await act(async () => {
      await result.current.connect('example.com:443');
    });

    expect(MockWebSocket).toHaveBeenCalledWith('wss://example.com:443/ws');
  });
});
