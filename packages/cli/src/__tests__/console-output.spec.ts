import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ConsoleOutput, createSpinner } from '../output/console';

// Mock ora
vi.mock('ora', () => ({
  default: vi.fn().mockReturnValue({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    warn: vi.fn().mockReturnThis(),
    text: '',
  }),
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
  },
}));

describe('output/console', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('ConsoleOutput.success', () => {
    it('should print success message in green', () => {
      ConsoleOutput.success('Test message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[green]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✓'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Test message'));
    });
  });

  describe('ConsoleOutput.error', () => {
    it('should print error message in red', () => {
      ConsoleOutput.error('Error message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[red]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('✗'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Error message'));
    });
  });

  describe('ConsoleOutput.warning', () => {
    it('should print warning message in yellow', () => {
      ConsoleOutput.warning('Warning message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[yellow]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Warning message'));
    });
  });

  describe('ConsoleOutput.info', () => {
    it('should print info message in blue', () => {
      ConsoleOutput.info('Info message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[blue]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('ℹ'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Info message'));
    });
  });

  describe('ConsoleOutput.muted', () => {
    it('should print muted message in gray', () => {
      ConsoleOutput.muted('Muted message');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[gray]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Muted message'));
    });
  });

  describe('ConsoleOutput.dryRun', () => {
    it('should print dry-run message in blue', () => {
      ConsoleOutput.dryRun('Would write file');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[blue]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[dry-run]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Would write file'));
    });
  });

  describe('ConsoleOutput.newline', () => {
    it('should print an empty line', () => {
      ConsoleOutput.newline();

      expect(consoleSpy).toHaveBeenCalledWith();
    });
  });

  describe('ConsoleOutput.header', () => {
    it('should print header in bold', () => {
      ConsoleOutput.header('Header text');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[bold]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Header text'));
    });
  });

  describe('ConsoleOutput.stats', () => {
    it('should print stats in gray', () => {
      ConsoleOutput.stats('Stats: 100ms');

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[gray]'));
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Stats: 100ms'));
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
  });
});
