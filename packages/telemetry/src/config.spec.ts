import { describe, expect, it } from 'vitest';
import { DEFAULT_TELEMETRY_ENDPOINT, resolveTelemetryConfig } from './config.js';

describe('resolveTelemetryConfig', () => {
  it('enables telemetry by default', () => {
    const config = resolveTelemetryConfig({
      environment: {},
      cacheDirectory: '/tmp/cache',
    });

    expect(config).toEqual({
      enabled: true,
      endpoint: DEFAULT_TELEMETRY_ENDPOINT,
      cacheDirectory: '/tmp/cache',
      vetoes: [],
    });
  });

  it.each([
    [{ DO_NOT_TRACK: '1' }, 'DO_NOT_TRACK'],
    [{ DO_NOT_TRACK: 'true' }, 'DO_NOT_TRACK'],
    [{ PROMPTSCRIPT_TELEMETRY: 'false' }, 'PROMPTSCRIPT_TELEMETRY'],
    [{ PROMPTSCRIPT_TELEMETRY: '0' }, 'PROMPTSCRIPT_TELEMETRY'],
    [{ PROMPTSCRIPT_TELEMETRY: 'off' }, 'PROMPTSCRIPT_TELEMETRY'],
  ])('honors environment veto %j', (environment, veto) => {
    const config = resolveTelemetryConfig({ environment });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain(veto);
  });

  it('treats DO_NOT_TRACK=0 as enabled', () => {
    const config = resolveTelemetryConfig({
      environment: { DO_NOT_TRACK: '0' },
    });

    expect(config.enabled).toBe(true);
  });

  it('does not let an environment opt-in override config vetoes', () => {
    const config = resolveTelemetryConfig({
      environment: { PROMPTSCRIPT_TELEMETRY: 'true' },
      userEnabled: false,
      projectEnabled: false,
    });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toEqual(['user config', 'project config']);
  });

  it('fails closed when configuration is unavailable', () => {
    const config = resolveTelemetryConfig({
      environment: {},
      configurationValid: false,
    });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('configuration unavailable');
  });

  it.each([
    'http://telemetry.example/v1/events',
    'https://user:secret@telemetry.example/v1/events',
    'not-a-url',
  ])('rejects insecure endpoint %s', (endpoint) => {
    const config = resolveTelemetryConfig({ environment: {}, endpoint });

    expect(config.enabled).toBe(false);
    expect(config.vetoes).toContain('insecure endpoint');
  });
});
