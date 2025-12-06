import { spawn } from 'child_process';

/**
 * Check if stdout is an interactive terminal (TTY).
 */
export function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

/**
 * Get the pager command from environment or use default.
 * Respects PAGER environment variable like git does.
 */
export function getPagerCommand(): string {
  return process.env.PAGER ?? 'less';
}

/**
 * Pager for streaming output through a pager like less/more.
 * Similar to how git handles long output.
 */
export class Pager {
  private lines: string[] = [];
  private enabled: boolean;

  constructor(enabled = true) {
    // Only use pager if stdout is a TTY and pager is enabled
    this.enabled = enabled && isTTY();
  }

  /**
   * Write a line to the pager buffer.
   */
  write(line: string): void {
    this.lines.push(line);
  }

  /**
   * Write multiple lines to the pager buffer.
   */
  writeLines(lines: string[]): void {
    this.lines.push(...lines);
  }

  /**
   * Flush all buffered content through the pager.
   * If pager is disabled or not a TTY, just prints to stdout.
   */
  async flush(): Promise<void> {
    const content = this.lines.join('\n');

    if (!this.enabled || this.lines.length === 0) {
      // No pager - just print directly
      if (content) {
        console.log(content);
      }
      return;
    }

    return new Promise((resolve) => {
      const pagerCmd = getPagerCommand();
      const [cmd, ...args] = pagerCmd.split(' ');

      // Add -R flag for less to handle ANSI colors
      if (cmd === 'less' && !args.includes('-R')) {
        args.push('-R');
      }

      const pager = spawn(cmd, args, {
        stdio: ['pipe', 'inherit', 'inherit'],
        env: {
          ...process.env,
          // Ensure less handles colors properly
          LESS: process.env.LESS ?? '-R',
        },
      });

      pager.on('error', (_err) => {
        // If pager fails (e.g., not installed), fall back to direct output
        console.log(content);
        resolve();
      });

      pager.on('close', () => {
        resolve();
      });

      // Write content to pager's stdin
      pager.stdin.write(content);
      pager.stdin.end();
    });
  }
}

/**
 * Create a new pager instance.
 * @param enabled - Whether to enable paging (default: true)
 */
export function createPager(enabled = true): Pager {
  return new Pager(enabled);
}
