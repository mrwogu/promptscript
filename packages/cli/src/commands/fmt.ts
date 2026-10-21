import {
  accessSync,
  constants,
  existsSync,
  lstatSync,
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { parseCanonical, printProgram } from '@promptscript/parser';
import type { FmtOptions } from '../types.js';
import { ConsoleOutput } from '../output/console.js';
import { writeFileAtomic } from '../utils/write-file-atomic.js';

/** Directories holding third-party sources that must never be rewritten. */
const SKIPPED_DIRS = new Set(['node_modules', 'vendor', '.cache']);

/** Keys that hold a source position; they legitimately change when the layout does. */
const POSITION_KEYS = new Set(['loc', 'titleLoc', 'sectionLoc', 'location']);

/**
 * The program as JSON without source positions. Syntax feature usages are left out
 * because they count occurrences, which a rewrite may change without changing the program.
 */
function programKey(program: unknown): string {
  return JSON.stringify(program, (key, value: unknown) => {
    if (key === 'syntaxFeatures') return undefined;
    const isPosition = typeof value === 'object' && value !== null && 'line' in value;
    return POSITION_KEYS.has(key) && isPosition ? undefined : value;
  });
}

/** Path relative to the working directory, as reported in messages. */
function displayName(file: string): string {
  const rel = relative(process.cwd(), file);
  return rel.startsWith('..') ? file : rel;
}

/**
 * Walk a directory for .prs files, symbolic links included so the caller can warn.
 * Unlike discoverPrsFiles, a directory that cannot be read is reported and the walk
 * continues, so readable files are still formatted and the failure is not swallowed.
 */
function walkPrsFiles(dir: string, failures: string[]): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIPPED_DIRS.has(entry.name)) results.push(...walkPrsFiles(fullPath, failures));
      } else if (entry.name.endsWith('.prs') && (entry.isFile() || entry.isSymbolicLink())) {
        results.push(fullPath);
      }
    }
  } catch (error) {
    // fs.readdirSync only ever throws Error instances.
    failures.push(`${displayName(dir)} ${(error as Error).message}`);
  }
  return results;
}

/** Order by UTF-16 code units so the result never depends on the locale. */
function comparePaths(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function isSymbolicLink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

function collectFiles(paths: string[], failures: string[]): string[] {
  const files = new Set<string>();
  for (const input of paths) {
    const target = resolve(input);
    if (isSymbolicLink(target)) {
      // A linked path can lead outside the project, so it is never followed.
      ConsoleOutput.warning(`Skipped ${input}: symbolic link`);
    } else if (!existsSync(target)) {
      failures.push(`Path not found: ${input}`);
    } else if (statSync(target).isDirectory()) {
      for (const file of walkPrsFiles(target, failures)) files.add(file);
    } else if (extname(target) !== '.prs') {
      ConsoleOutput.warning(`Skipped ${input}: not a .prs file`);
    } else if (!statSync(target).isFile()) {
      failures.push(`${input} is not a regular file`);
    } else {
      files.add(target);
    }
  }
  return [...files].sort(comparePaths);
}

type FileOutcome = 'changed' | 'unchanged' | 'skipped' | 'failed';
type ParseErrors = ReturnType<typeof parseCanonical>['errors'];

function describeParseFailure(name: string, errors: ParseErrors): string {
  const first = errors[0];
  const loc = first?.location;
  // The parser reports -1:-1 for errors at end of input.
  const where = loc && loc.line > 0 ? `:${loc.line}:${loc.column}` : '';
  const message = first?.message.split('\n')[0] ?? 'Parse failed';
  return `${name}${where} ${message}`;
}

function writeFormatted(
  file: string,
  name: string,
  formatted: string,
  failures: string[]
): FileOutcome {
  try {
    accessSync(file, constants.W_OK);
  } catch {
    failures.push(`${name} not writable`);
    return 'failed';
  }
  writeFileAtomic(file, formatted, statSync(file).mode & 0o7777);
  ConsoleOutput.success(`Formatted ${name}`);
  return 'changed';
}

function formatOne(file: string, name: string, check: boolean, failures: string[]): FileOutcome {
  try {
    if (lstatSync(file).isSymbolicLink()) {
      ConsoleOutput.warning(`Skipped ${name}: symbolic link`);
      return 'skipped';
    }
    const source = readFileSync(file, 'utf-8');
    const { ast, errors, comments } = parseCanonical(source, { filename: name });
    if (!ast || errors.length > 0) {
      failures.push(describeParseFailure(name, errors));
      return 'failed';
    }

    const formatted = printProgram(ast, comments);
    if (formatted === source) return 'unchanged';
    const reparsed = parseCanonical(formatted, { filename: name });
    if (reparsed.errors.length > 0) {
      failures.push(`${name} printer produced unparseable output, file left untouched`);
      return 'failed';
    }
    if (programKey(reparsed.ast) !== programKey(ast)) {
      failures.push(
        `${name} formatted output does not parse to the same program, file not written`
      );
      return 'failed';
    }
    if (check) {
      ConsoleOutput.warning(`Would reformat ${name}`);
      return 'changed';
    }
    return writeFormatted(file, name, formatted, failures);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name} ${message}`);
    return 'failed';
  }
}

/**
 * `prs fmt [paths...]` - rewrite .prs files in canonical form.
 */
export function fmtCommand(options: FmtOptions): void {
  const failures: string[] = [];
  const requested = options.paths && options.paths.length > 0 ? options.paths : ['.promptscript'];
  const files = collectFiles(requested, failures);
  const counts: Record<FileOutcome, number> = { changed: 0, unchanged: 0, skipped: 0, failed: 0 };

  for (const file of files) {
    counts[formatOne(file, displayName(file), options.check === true, failures)]++;
  }

  for (const failure of failures) ConsoleOutput.error(failure);
  ConsoleOutput.newline();
  const verb = options.check ? 'would change' : 'formatted';
  ConsoleOutput.stats(
    `${counts.changed} ${verb}, ${counts.unchanged} unchanged, ${failures.length} failed`
  );

  if (failures.length > 0 || (options.check && counts.changed > 0)) process.exitCode = 1;
}
