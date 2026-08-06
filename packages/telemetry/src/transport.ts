import type { SendResult, TelemetryPayload } from './types.js';

export type TelemetryFetch = (
  input: string | URL | Request,
  init?: RequestInit
) => Promise<Response>;

function isSecureEndpoint(endpoint: string): boolean {
  try {
    const url = new URL(endpoint);
    return url.protocol === 'https:' && url.username === '' && url.password === '';
  } catch {
    return false;
  }
}

export async function postTelemetry(
  endpoint: string,
  payload: TelemetryPayload,
  timeoutMs: number,
  fetchImplementation: TelemetryFetch = fetch
): Promise<SendResult> {
  if (!isSecureEndpoint(endpoint)) {
    return 'rejected';
  }
  const controller = new AbortController();
  const timeout = setTimeout(
    () => {
      controller.abort();
    },
    Math.max(0, timeoutMs)
  );
  try {
    const response = await fetchImplementation(endpoint, {
      method: 'POST',
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'promptscript-telemetry/1',
      },
      body: JSON.stringify(payload),
    });
    if (response.ok) {
      return 'sent';
    }
    if (response.status >= 300 && response.status < 400) {
      return 'rejected';
    }
    if (response.status === 429 || response.status >= 500) {
      return 'retryable';
    }
    if (response.status >= 400 && response.status < 500) {
      return 'rejected';
    }
    return 'retryable';
  } catch {
    return 'unknown';
  } finally {
    clearTimeout(timeout);
  }
}
