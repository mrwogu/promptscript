import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { relative, resolve, sep } from 'node:path';
import { parseCanonical, printProgram } from '@promptscript/parser';
import type { FmtOptions } from '../types.js';
import { ConsoleOutput } from '../output/console.js';
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
      for (const file of discoverPrsFiles(target)) {
        if (!isSkipped(file, target)) files.add(file);
      }
    } else {
      files.add(target);
    }
  }
  return [...files].sort();
}

/**
 * `prs fmt [paths...]` - rewrite .prs files in canonical form.
 */
export function fmtCommand(options: FmtOptions): void {
  const failures: string[] = [];
  const requested = options.paths && options.paths.length > 0 ? options.paths : ['.promptscript'];
  const files = collectFiles(requested, failures);
  let changed = 0;
  let unchanged = 0;

  for (const file of files) {
    const rel = relative(process.cwd(), file);
    const name = rel.startsWith('..') ? file : rel;
    const source = readFileSync(file, 'utf-8');
    const { ast, errors, comments } = parseCanonical(source, { filename: name });
    if (!ast || errors.length > 0) {
      const first = errors[0];
      const loc = first?.location;
      // The parser reports -1:-1 for errors at end of input.
      const where = loc && loc.line > 0 ? `:${loc.line}:${loc.column}` : '';
      const message = first?.message.split('\n')[0] ?? 'Parse failed';
      failures.push(`${name}${where} ${message}`);
      continue;
    }

    const formatted = printProgram(ast, comments);
    if (formatted === source) {
      unchanged++;
      continue;
    }
    changed++;
    if (options.check) {
      ConsoleOutput.warning(`Would reformat ${name}`);
    } else {
      writeFileSync(file, formatted, 'utf-8');
      ConsoleOutput.success(`Formatted ${name}`);
    }
  }

  for (const failure of failures) ConsoleOutput.error(failure);
  ConsoleOutput.newline();
  const verb = options.check ? 'would change' : 'formatted';
  ConsoleOutput.stats(`${changed} ${verb}, ${unchanged} unchanged, ${failures.length} failed`);

  if (failures.length > 0 || (options.check && changed > 0)) process.exitCode = 1;
}
