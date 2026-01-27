/**
 * Logger interface for verbose/debug output during compilation.
 *
 * Components in the PromptScript pipeline accept an optional Logger
 * to report their progress. The CLI creates a logger that outputs
 * to the console based on --verbose and --debug flags.
 *
 * @example
 * ```typescript
 * const logger: Logger = {
 *   verbose: (msg) => console.log(`[verbose] ${msg}`),
 *   debug: (msg) => console.log(`[debug] ${msg}`),
 * };
 *
 * const compiler = new Compiler({ logger });
 * ```
 */
export interface Logger {
  /**
   * Log verbose message.
   * Shown with --verbose and --debug flags.
   */
  verbose(message: string): void;

  /**
   * Log debug message.
   * Shown only with --debug flag.
   */
  debug(message: string): void;
}

/**
 * No-op logger that discards all messages.
 * Used as default when no logger is provided.
 */
export const noopLogger: Logger = {
  verbose: () => {},
  debug: () => {},
};

/**
 * Create a logger from callback functions.
 *
 * @param options - Logger callbacks
 * @returns Logger instance
 */
export function createLogger(options: {
  verbose?: (message: string) => void;
  debug?: (message: string) => void;
}): Logger {
  return {
    verbose: options.verbose ?? (() => {}),
    debug: options.debug ?? (() => {}),
  };
}
