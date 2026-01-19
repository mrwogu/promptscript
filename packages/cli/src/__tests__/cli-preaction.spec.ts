import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setContext, getContext, LogLevel } from '../output/console';

interface CliOptions {
  quiet?: boolean;
  verbose?: boolean;
}

describe('cli preAction hook behavior', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset context to normal state before each test
    setContext({ logLevel: LogLevel.Normal });
    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    setContext({ logLevel: LogLevel.Normal });
  });

  describe('context flags', () => {
    it('should set quiet mode when quiet flag is passed', () => {
      // Simulate the hook logic directly
      const opts: CliOptions = { quiet: true };

      if (opts['quiet']) {
        setContext({ logLevel: LogLevel.Quiet });
      } else if (opts['verbose']) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Quiet);
    });

    it('should set verbose mode when verbose flag is passed', () => {
      const opts: CliOptions = { verbose: true };

      if (opts['quiet']) {
        setContext({ logLevel: LogLevel.Quiet });
      } else if (opts['verbose']) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Verbose);
    });

    it('should prefer quiet over verbose when both are passed', () => {
      const opts: CliOptions = { quiet: true, verbose: true };

      if (opts['quiet']) {
        setContext({ logLevel: LogLevel.Quiet });
      } else if (opts['verbose']) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Quiet);
    });

    it('should keep normal mode when no flags are passed', () => {
      const opts: CliOptions = {};

      if (opts['quiet']) {
        setContext({ logLevel: LogLevel.Quiet });
      } else if (opts['verbose']) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Normal);
    });
  });

  describe('environment variable PROMPTSCRIPT_VERBOSE', () => {
    it('should set verbose mode when PROMPTSCRIPT_VERBOSE=1', () => {
      process.env['PROMPTSCRIPT_VERBOSE'] = '1';

      // Simulate the hook logic
      if (
        process.env['PROMPTSCRIPT_VERBOSE'] === '1' ||
        process.env['PROMPTSCRIPT_VERBOSE'] === 'true'
      ) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Verbose);
    });

    it('should set verbose mode when PROMPTSCRIPT_VERBOSE=true', () => {
      process.env['PROMPTSCRIPT_VERBOSE'] = 'true';

      if (
        process.env['PROMPTSCRIPT_VERBOSE'] === '1' ||
        process.env['PROMPTSCRIPT_VERBOSE'] === 'true'
      ) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Verbose);
    });

    it('should not set verbose mode when PROMPTSCRIPT_VERBOSE is other value', () => {
      process.env['PROMPTSCRIPT_VERBOSE'] = 'false';

      if (
        process.env['PROMPTSCRIPT_VERBOSE'] === '1' ||
        process.env['PROMPTSCRIPT_VERBOSE'] === 'true'
      ) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Normal);
    });

    it('should not set verbose mode when PROMPTSCRIPT_VERBOSE is not set', () => {
      delete process.env['PROMPTSCRIPT_VERBOSE'];

      if (
        process.env['PROMPTSCRIPT_VERBOSE'] === '1' ||
        process.env['PROMPTSCRIPT_VERBOSE'] === 'true'
      ) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Normal);
    });
  });

  describe('combined flags and environment', () => {
    it('should allow env var to override when no flags are set', () => {
      const opts: CliOptions = {};
      process.env['PROMPTSCRIPT_VERBOSE'] = '1';

      // First check flags
      if (opts['quiet']) {
        setContext({ logLevel: LogLevel.Quiet });
      } else if (opts['verbose']) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      // Then check env var
      if (
        process.env['PROMPTSCRIPT_VERBOSE'] === '1' ||
        process.env['PROMPTSCRIPT_VERBOSE'] === 'true'
      ) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Verbose);
    });

    it('should override quiet flag with env var since env is checked last', () => {
      const opts: { quiet?: boolean; verbose?: boolean } = { quiet: true };
      process.env['PROMPTSCRIPT_VERBOSE'] = '1';

      // First check flags (sets to quiet)
      if (opts['quiet']) {
        setContext({ logLevel: LogLevel.Quiet });
      } else if (opts['verbose']) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      // Then check env var (overrides to verbose)
      if (
        process.env['PROMPTSCRIPT_VERBOSE'] === '1' ||
        process.env['PROMPTSCRIPT_VERBOSE'] === 'true'
      ) {
        setContext({ logLevel: LogLevel.Verbose });
      }

      expect(getContext().logLevel).toBe(LogLevel.Verbose);
    });
  });
});
