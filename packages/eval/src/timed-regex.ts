import { createContext, Script } from 'node:vm';

/** Time limit of one regex test on model output, in milliseconds. */
export const REGEX_TIMEOUT_MS = 1000;

const context = createContext({ pattern: '', flags: '', text: '' });
const script = new Script('new RegExp(pattern, flags).test(text)');
const TIMEOUT_CODE = 'ERR_SCRIPT_EXECUTION_TIMEOUT';
let deadline = Infinity;

/**
 * Run `run` with a total regex time budget, shared by every
 * {@link timedRegexTest} call inside it, so many slow calls cannot add up
 * past it. Everything inside runs synchronously.
 *
 * @param ms - Budget in milliseconds
 * @param run - Work that tests regexes
 * @returns What `run` returns
 */
export function withRegexBudget<T>(ms: number, run: () => T): T {
  const saved = deadline;
  deadline = Math.min(saved, Date.now() + ms);
  try {
    return run();
  } finally {
    deadline = saved;
  }
}

/**
 * Test a pattern against a text with a time limit. Patterns come from suite
 * authors and texts from models, so a pattern that backtracks stops after
 * {@link REGEX_TIMEOUT_MS} instead of hanging the run.
 *
 * @param pattern - Regular expression source
 * @param flags - Regular expression flags
 * @param text - Text to test
 * @param timeoutMs - Time limit; default {@link REGEX_TIMEOUT_MS}, less when a budget runs out sooner
 * @returns Whether the pattern matches
 * @throws An `ERR_SCRIPT_EXECUTION_TIMEOUT` error when the limit or the budget is hit
 */
export function timedRegexTest(
  pattern: string,
  flags: string,
  text: string,
  timeoutMs = REGEX_TIMEOUT_MS
): boolean {
  const left = Math.min(timeoutMs, deadline - Date.now());
  if (left <= 0) {
    throw Object.assign(new Error('The regex time budget is spent.'), { code: TIMEOUT_CODE });
  }
  Object.assign(context, { pattern, flags, text });
  return script.runInContext(context, { timeout: Math.ceil(left) }) === true;
}

/** True when `error` is the time limit of {@link timedRegexTest}. */
export function isRegexTimeout(error: unknown): boolean {
  return (error as NodeJS.ErrnoException | undefined)?.code === TIMEOUT_CODE;
}

/**
 * Regex engine for Ajv `code.regExp`, so `pattern` and `patternProperties`
 * in schemas run with the same time limit. The pattern is compiled once up
 * front, so a bad pattern still fails when the schema compiles.
 */
export const timedRegExp = Object.assign(
  (pattern: string, flags: string) => {
    const regex = new RegExp(pattern, flags);
    return {
      test: (text: string): boolean => timedRegexTest(pattern, flags, text),
      // Ajv caches compiled patterns by this string
      toString: (): string => regex.toString(),
    };
  },
  // Only used when Ajv writes standalone code, which eval never does
  { code: 'timedRegExp' }
);
