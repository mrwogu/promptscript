// Public project numbers, fetched once at build time. A failed or slow request
// just leaves the number out; the build never fails because of it.

export interface ProjectStats {
  stars?: number;
  monthlyDownloads?: number;
}

const TIMEOUT_MS = 5000;

async function fetchNumber(
  url: string,
  pick: (body: unknown) => unknown
): Promise<number | undefined> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) return undefined;
    const value = pick(await response.json());
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

function field(name: string): (body: unknown) => unknown {
  return (body) =>
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[name] : undefined;
}

let cached: Promise<ProjectStats> | undefined;

export function projectStats(): Promise<ProjectStats> {
  cached ??= Promise.all([
    fetchNumber('https://api.github.com/repos/mrwogu/promptscript', field('stargazers_count')),
    fetchNumber(
      'https://api.npmjs.org/downloads/point/last-month/@promptscript/cli',
      field('downloads')
    ),
  ]).then(([stars, monthlyDownloads]) => ({ stars, monthlyDownloads }));
  return cached;
}

/** 384 -> "384", 2884 -> "2.9k", 12500 -> "13k". */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  const thousands = value / 1000;
  return `${thousands < 10 ? thousands.toFixed(1).replace(/\.0$/, '') : Math.round(thousands)}k`;
}

/** Short proof line for the homepage, empty when no number is known. */
export function statsLine(stats: ProjectStats): string {
  const parts: string[] = [];
  if (stats.stars !== undefined) parts.push(`★ ${formatCount(stats.stars)} GitHub stars`);
  if (stats.monthlyDownloads !== undefined) {
    parts.push(`${formatCount(stats.monthlyDownloads)} npm downloads last month`);
  }
  return parts.join(' · ');
}
