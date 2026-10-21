import { accessSync, constants, existsSync, lstatSync, readFileSync, statSync } from 'node:fs';
import { extname, relative, resolve, sep } from 'node:path';
import { parseCanonical, printProgram } from '@promptscript/parser';
import type { FmtOptions } from '../types.js';
import { ConsoleOutput } from '../output/console.js';
import { writeFileAtomic } from '../utils/write-file-atomic.js';
import { discoverPrsFiles } from './validate.js';

/** Directories holding third-party sources that must never be rewritten. */
const SKIPPED_DIRS = new Set(['node_modules', 'vendor', '.cache']);

function isSkipped(file: string, root: string): boolean {
  return relative(root, file)
    .split(sep)
    .slice(0, -1)
    .some((segment) => SKIPPED_DIRS.has(segment));
}

function collectFiles(paths: string[], failures: string[]): string[] {
  const files = new Set<string>();
  for (const input of paths) {
    const target = resolve(input);
    if (!existsSync(target)) {
      failures.push(`Path not found: ${input}`);
    } else if (statSync(target).isDirectory()) {
      for (const file of discoverPrsFiles(target, false, true)) {
        if (!isSkipped(file, target)) files.add(file);
      }
    } else if (extname(target) !== '.prs') {
      ConsoleOutput.warning(`Skipped ${input}: not a .prs file`);
    } else {
      files.add(target);
    }
  }
  // Compare by code units so the order never depends on the locale.
  return [...files].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
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
    if (parseCanonical(formatted, { filename: name }).errors.length > 0) {
      failures.push(`${name} printer produced unparseable output, file left untouched`);
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
    const rel = relative(process.cwd(), file);
    const name = rel.startsWith('..') ? file : rel;
    counts[formatOne(file, name, options.check === true, failures)]++;
  }

  for (const failure of failures) ConsoleOutput.error(failure);
  ConsoleOutput.newline();
  const verb = options.check ? 'would change' : 'formatted';
  ConsoleOutput.stats(
    `${counts.changed} ${verb}, ${counts.unchanged} unchanged, ${failures.length} failed`
  );

  if (failures.length > 0 || (options.check && counts.changed > 0)) process.exitCode = 1;
}
