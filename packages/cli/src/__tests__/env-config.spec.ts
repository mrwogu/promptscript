import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadEnvOverrides } from '../config/env-config.js';

describe('config/env-config', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clean relevant env vars
    delete process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'];
    delete process.env['PROMPTSCRIPT_REGISTRY_GIT_REF'];
    delete process.env['PROMPTSCRIPT_REGISTRY_URL'];
    delete process.env['PROMPTSCRIPT_CACHE_TTL'];
    delete process.env['PROMPTSCRIPT_CACHE_ENABLED'];
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('should return empty overrides when no env vars are set', () => {
    const overrides = loadEnvOverrides();

    expect(overrides).toEqual({});
  });

  it('should map PROMPTSCRIPT_REGISTRY_GIT_URL to registry.git.url', () => {
    process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = 'https://github.com/org/reg.git';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.git?.url).toBe('https://github.com/org/reg.git');
  });

  it('should map PROMPTSCRIPT_REGISTRY_GIT_REF to registry.git.ref', () => {
    process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = 'https://github.com/org/reg.git';
    process.env['PROMPTSCRIPT_REGISTRY_GIT_REF'] = 'v2.0';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.git?.ref).toBe('v2.0');
  });

  it('should map PROMPTSCRIPT_REGISTRY_URL to registry.url', () => {
    process.env['PROMPTSCRIPT_REGISTRY_URL'] = 'https://registry.example.com';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.url).toBe('https://registry.example.com');
  });

  it('should parse PROMPTSCRIPT_CACHE_TTL as number', () => {
    process.env['PROMPTSCRIPT_CACHE_TTL'] = '3600000';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.cache?.ttl).toBe(3600000);
  });

  it('should ignore invalid PROMPTSCRIPT_CACHE_TTL', () => {
    process.env['PROMPTSCRIPT_CACHE_TTL'] = 'not-a-number';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.cache?.ttl).toBeUndefined();
  });

  it('should parse PROMPTSCRIPT_CACHE_ENABLED as boolean (true)', () => {
    process.env['PROMPTSCRIPT_CACHE_ENABLED'] = 'true';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.cache?.enabled).toBe(true);
  });

  it('should parse PROMPTSCRIPT_CACHE_ENABLED as boolean (1)', () => {
    process.env['PROMPTSCRIPT_CACHE_ENABLED'] = '1';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.cache?.enabled).toBe(true);
  });

  it('should parse PROMPTSCRIPT_CACHE_ENABLED as boolean (false)', () => {
    process.env['PROMPTSCRIPT_CACHE_ENABLED'] = 'false';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.cache?.enabled).toBe(false);
  });

  it('should ignore PROMPTSCRIPT_REGISTRY_GIT_REF without PROMPTSCRIPT_REGISTRY_GIT_URL', () => {
    process.env['PROMPTSCRIPT_REGISTRY_GIT_REF'] = 'develop';

    const overrides = loadEnvOverrides();

    // gitRef alone should not create a registry.git entry
    expect(overrides.registry?.git).toBeUndefined();
  });

  it('should combine multiple env vars', () => {
    process.env['PROMPTSCRIPT_REGISTRY_GIT_URL'] = 'https://github.com/org/reg.git';
    process.env['PROMPTSCRIPT_REGISTRY_GIT_REF'] = 'develop';
    process.env['PROMPTSCRIPT_CACHE_TTL'] = '60000';
    process.env['PROMPTSCRIPT_CACHE_ENABLED'] = 'true';

    const overrides = loadEnvOverrides();

    expect(overrides.registry?.git?.url).toBe('https://github.com/org/reg.git');
    expect(overrides.registry?.git?.ref).toBe('develop');
    expect(overrides.registry?.cache?.ttl).toBe(60000);
    expect(overrides.registry?.cache?.enabled).toBe(true);
  });
});
