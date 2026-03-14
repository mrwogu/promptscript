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
});
