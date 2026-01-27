import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ConsoleOutput,
  createSpinner,
  setContext,
  getContext,
  isVerbose,
  isQuiet,
  isDebug,
  LogLevel,
} from '../output/console.js';

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn().mockImplementation((options) => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
    isSilent: typeof options === 'object' && options.isSilent,
  })),
}));

// Mock chalk
vi.mock('chalk', () => ({
  default: {
    green: (s: string) => `[green]${s}[/green]`,
    red: (s: string) => `[red]${s}[/red]`,
    yellow: (s: string) => `[yellow]${s}[/yellow]`,
    blue: (s: string) => `[blue]${s}[/blue]`,
    gray: (s: string) => `[gray]${s}[/gray]`,
    cyan: (s: string) => `[cyan]${s}[/cyan]`,
    bold: (s: string) => `[bold]${s}[/bold]`,
    dim: (s: string) => `[dim]${s}[/dim]`,
  },
}));

describe('output/console', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Reset context to default
    setContext({ logLevel: LogLevel.Normal, colors: true });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    setContext({ logLevel: LogLevel.Normal, colors: true });
  });

  describe('LogLevel', () => {
    it('should have correct values', () => {
      expect(LogLevel.Quiet).toBe(0);
      expect(LogLevel.Normal).toBe(1);
      expect(LogLevel.Verbose).toBe(2);
    });
  });

  describe('setContext and getContext', () => {
    it('should set and get context', () => {
      setContext({ logLevel: LogLevel.Verbose });
      const ctx = getContext();
      expect(ctx.logLevel).toBe(LogLevel.Verbose);
    });

    it('should merge partial context', () => {
      setContext({ colors: false });
      const ctx = getContext();
      expect(ctx.colors).toBe(false);
      expect(ctx.logLevel).toBe(LogLevel.Normal);
    });
  });

  describe('isVerbose', () => {
    it('should return true when log level is verbose', () => {
      setContext({ logLevel: LogLevel.Verbose });
      expect(isVerbose()).toBe(true);
    });

    it('should return false when log level is normal', () => {
      setContext({ logLevel: LogLevel.Normal });
      expect(isVerbose()).toBe(false);
    });

    it('should return false when log level is quiet', () => {
      setContext({ logLevel: LogLevel.Quiet });
      expect(isVerbose()).toBe(false);
    });
  });

  describe('isQuiet', () => {
    it('should return true when log level is quiet', () => {
      setContext({ logLevel: LogLevel.Quiet });
      expect(isQuiet()).toBe(true);
    });

    it('should return false when log level is normal', () => {
      setContext({ logLevel: LogLevel.Normal });
      expect(isQuiet()).toBe(false);
    });

    it('should return false when log level is verbose', () => {
      setContext({ logLevel: LogLevel.Verbose });
      expect(isQuiet()).toBe(false);
    });
  });

  describe('isDebug', () => {
    it('should return true when log level is debug', () => {
      setContext({ logLevel: LogLevel.Debug });
      expect(isDebug()).toBe(true);
    });

    it('should return false when log level is normal', () => {
      setContext({ logLevel: LogLevel.Normal });
      expect(isDebug()).toBe(false);
    });

    it('should return false when log level is verbose', () => {
      setContext({ logLevel: LogLevel.Verbose });
      expect(isDebug()).toBe(false);
    });

    it('should return false when log level is quiet', () => {
      setContext({ logLevel: LogLevel.Quiet });
      expect(isDebug()).toBe(false);
    });
  });

  describe('ConsoleOutput.success', () => {
    it('should print success message in green', () => {
      ConsoleOutput.success('Test message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[green]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.success('Test message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.error', () => {
    it('should print error message in red', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      ConsoleOutput.error('Error message');

      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('[red]'));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));

      errorSpy.mockRestore();
    });

    it('should always print even in quiet mode', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      setContext({ logLevel: LogLevel.Quiet });

      ConsoleOutput.error('Error message');

      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('ConsoleOutput.warning', () => {
    it('should print warning message in yellow', () => {
      ConsoleOutput.warning('Warning message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[yellow]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.warning('Warning message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.warn', () => {
    it('should print warn message in yellow (alias for warning)', () => {
      ConsoleOutput.warn('Warn message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[yellow]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Warn message'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.warn('Warn message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.info', () => {
    it('should print info message in blue', () => {
      ConsoleOutput.info('Info message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[blue]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.info('Info message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.skipped', () => {
    it('should print skipped message in yellow', () => {
      ConsoleOutput.skipped('Skipped file');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[yellow]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⊘'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Skipped file'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.skipped('Skipped file');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.unchanged', () => {
    it('should print unchanged message in gray', () => {
      ConsoleOutput.unchanged('Unchanged file');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[gray]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('○'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unchanged file'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.unchanged('Unchanged file');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.muted', () => {
    it('should print muted message in gray', () => {
      ConsoleOutput.muted('Muted message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[gray]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Muted message'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.muted('Muted message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.verbose', () => {
    it('should print verbose message when in verbose mode', () => {
      setContext({ logLevel: LogLevel.Verbose });
      ConsoleOutput.verbose('Verbose message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[verbose]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Verbose message'));
    });

    it('should not print in normal mode', () => {
      setContext({ logLevel: LogLevel.Normal });
      ConsoleOutput.verbose('Verbose message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.debug', () => {
    it('should print debug message when in verbose mode', () => {
      setContext({ logLevel: LogLevel.Verbose });
      ConsoleOutput.debug('Debug message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[debug]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Debug message'));
    });

    it('should not print in normal mode', () => {
      setContext({ logLevel: LogLevel.Normal });
      ConsoleOutput.debug('Debug message');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.dryRun', () => {
    it('should print dry-run message in blue', () => {
      ConsoleOutput.dryRun('Would write file');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[blue]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[dry-run]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Would write file'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.dryRun('Would write file');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.newline', () => {
    it('should print an empty line', () => {
      ConsoleOutput.newline();

      expect(consoleSpy).toHaveBeenCalledWith();
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.newline();
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.header', () => {
    it('should print header in bold', () => {
      ConsoleOutput.header('Header text');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[bold]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Header text'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.header('Header text');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.stats', () => {
    it('should print stats in gray', () => {
      ConsoleOutput.stats('Stats: 100ms');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[gray]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Stats: 100ms'));
    });

    it('should not print in quiet mode', () => {
      setContext({ logLevel: LogLevel.Quiet });
      ConsoleOutput.stats('Stats: 100ms');
      expect(consoleSpy).not.toHaveBeenCalled();
    });
  });

  describe('ConsoleOutput.formatPath', () => {
    it('should format path in cyan', () => {
      const result = ConsoleOutput.formatPath('/path/to/file.ts');

      expect(result).toContain('[cyan]');
      expect(result).toContain('/path/to/file.ts');
    });
  });

  describe('ConsoleOutput.formatLocation', () => {
    it('should format location with file only', () => {
      const result = ConsoleOutput.formatLocation('file.ts');

      expect(result).toContain('[gray]');
      expect(result).toContain('at file.ts');
    });

    it('should format location with file and line', () => {
      const result = ConsoleOutput.formatLocation('file.ts', 10);

      expect(result).toContain('at file.ts:10');
    });

    it('should format location with file, line, and column', () => {
      const result = ConsoleOutput.formatLocation('file.ts', 10, 5);

      expect(result).toContain('at file.ts:10:5');
    });
  });

  describe('createSpinner', () => {
    it('should create and start a spinner with given text', async () => {
      const ora = await import('ora');
      createSpinner('Loading...');

      expect(ora.default).toHaveBeenCalledWith('Loading...');
    });

    it('should create silent spinner in quiet mode', async () => {
      const ora = await import('ora');
      setContext({ logLevel: LogLevel.Quiet });
      createSpinner('Loading...');

      expect(ora.default).toHaveBeenCalledWith({ isSilent: true });
    });
  });
});
