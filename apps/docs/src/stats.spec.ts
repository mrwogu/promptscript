import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatCount, statsLine } from './stats';

describe('formatCount', () => {
  it('keeps small numbers and shortens thousands', () => {
    expect(formatCount(384)).toBe('384');
    expect(formatCount(2884)).toBe('2.9k');
    expect(formatCount(3000)).toBe('3k');
    expect(formatCount(12500)).toBe('13k');
  });
});

describe('statsLine', () => {
  it('lists only the numbers that are known', () => {
    expect(statsLine({ stars: 384, monthlyDownloads: 2884 })).toBe(
      '★ 384 GitHub stars · 2.9k npm downloads last month'
    );
    expect(statsLine({ monthlyDownloads: 2884 })).toBe('2.9k npm downloads last month');
    expect(statsLine({})).toBe('');
  });
});

describe('projectStats', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('reads both numbers from the APIs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => ({
        ok: true,
        json: async () =>
          url.includes('github') ? { stargazers_count: 384 } : { downloads: 2884 },
      }))
    );
    const { projectStats } = await import('./stats');

    await expect(projectStats()).resolves.toEqual({ stars: 384, monthlyDownloads: 2884 });
  });

  it('leaves numbers out when a request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('github')) throw new Error('offline');
        return { ok: false, json: async () => ({}) };
      })
    );
    const { projectStats } = await import('./stats');

    await expect(projectStats()).resolves.toEqual({
      stars: undefined,
      monthlyDownloads: undefined,
    });
  });
});
