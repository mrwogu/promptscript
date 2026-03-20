import { describe, it, expect, vi } from 'vitest';
import { noopLogger, createLogger } from '../logger.js';

describe('noopLogger', () => {
  it('verbose should not throw', () => {
    expect(() => noopLogger.verbose('test message')).not.toThrow();
  });

  it('debug should not throw', () => {
    expect(() => noopLogger.debug('test message')).not.toThrow();
  });

  it('should have both required methods', () => {
    expect(typeof noopLogger.verbose).toBe('function');
    expect(typeof noopLogger.debug).toBe('function');
  });
});

describe('createLogger', () => {
  it('should return a logger with all required methods', () => {
    const logger = createLogger({});
    expect(typeof logger.verbose).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should call provided verbose callback', () => {
    const verbose = vi.fn();
    const logger = createLogger({ verbose });
    logger.verbose('hello');
    expect(verbose).toHaveBeenCalledWith('hello');
  });

  it('should call provided debug callback', () => {
    const debug = vi.fn();
    const logger = createLogger({ debug });
    logger.debug('hello');
    expect(debug).toHaveBeenCalledWith('hello');
  });

  it('should use noop for missing verbose callback', () => {
    const logger = createLogger({ debug: vi.fn() });
    expect(() => logger.verbose('test')).not.toThrow();
  });

  it('should use noop for missing debug callback', () => {
    const logger = createLogger({ verbose: vi.fn() });
    expect(() => logger.debug('test')).not.toThrow();
  });
});
