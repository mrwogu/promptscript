import { existsSync } from 'fs';
import { relative, resolve } from 'path';
import {
  collectProvenance,
  type Program,
  type ProvenanceEntry,
  type ProvenanceTrace,
  type SourceLocation,
} from '@promptscript/core';
import { Resolver } from '@promptscript/resolver';
import type { ExplainOptions } from '../types.js';
import { CONFIG_FILES, loadConfig } from '../config/loader.js';
import { resolveRegistryPath } from '../utils/registry-resolver.js';
import { ConsoleOutput, createSpinner } from '../output/console.js';

interface ExplainMatch {
  readonly entry: ProvenanceEntry;
  readonly value: unknown;
}

interface ExplainDiagnostic {
  readonly message: string;
  readonly location?: SourceLocation;
  readonly relatedPaths?: readonly string[];
}

function normalizePath(path: string): string {
  return path.startsWith('@') ? path.slice(1) : path;
}

function pathMatches(entryPath: string, requestedPath: string): boolean {
  if (entryPath === requestedPath) return true;
  return entryPath.startsWith(`${requestedPath}.`) || entryPath.startsWith(`${requestedPath}[`);
}

function tokenizePath(path: string): Array<string | number> {
  const tokens: Array<string | number> = [];
  const matcher = /([^[.\]]+)|\[(\d+)\]/g;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(path)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else tokens.push(Number(match[2]));
  }
  return tokens;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readValueAtPath(ast: Program, path: string): unknown {
  const tokens = tokenizePath(path);
  const first = tokens.shift();
  if (typeof first !== 'string') return undefined;

  const block = ast.blocks.find((candidate) => candidate.name === first);
  if (!block) return undefined;

  let value: unknown = block.content;
  for (const token of tokens) {
    if (token === 'text' && isRecord(value)) {
      const contentType = value['type'];
      if (contentType === 'TextContent') {
        value = value['value'];
      } else if (contentType === 'MixedContent') {
        value = value['text'];
      }
      continue;
    }
    if (typeof token === 'number') {
      if (Array.isArray(value)) {
        value = value[token];
      } else if (typeof value === 'string') {
        value = value[token];
      } else if (isRecord(value) && value['type'] === 'TextContent') {
        value = value['value'];
      } else {
        return undefined;
      }
      continue;
    }
    if (isRecord(value)) {
      if (value['type'] === 'TextContent' && token === 'value') {
        value = value['value'];
      } else if (Object.hasOwn(value, token)) {
        value = value[token];
      } else if (value['type'] === 'ObjectContent' && isRecord(value['properties'])) {
        value = value['properties'][token];
      } else if (value['type'] === 'MixedContent' && isRecord(value['properties'])) {
        value = value['properties'][token];
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }
  return value;
}

function traceForResult(
  ast: Program,
  trace: ProvenanceTrace | undefined,
  entry: string
): ProvenanceTrace {
  return trace ?? collectProvenance(ast, { entry });
}

function findMatches(ast: Program, trace: ProvenanceTrace, requestedPath: string): ExplainMatch[] {
  return trace.entries
    .filter((entry) => pathMatches(entry.path, requestedPath))
    .map((entry) => ({
      entry,
      value: readValueAtPath(ast, entry.path),
    }));
}

interface PathOutputOptions {
  readonly projectRoot: string;
  readonly absolutePaths: boolean;
}

function sanitizePath(path: string, options: PathOutputOptions): string {
  if (options.absolutePaths || !path.startsWith('/')) return path;
  const relativePath = relative(options.projectRoot, path);
  return relativePath || '.';
}

function sanitizeText(value: string, options: PathOutputOptions): string {
  if (options.absolutePaths) return value;
  return value.replaceAll(options.projectRoot, '.');
}

function sanitizeReference(value: string, options: PathOutputOptions): string {
  return value.startsWith('/') ? sanitizePath(value, options) : sanitizeText(value, options);
}

function sanitizeValue(
  value: unknown,
  options: PathOutputOptions,
  seen: WeakSet<object> = new WeakSet<object>()
): unknown {
  if (typeof value === 'string') {
    return value.startsWith('/') ? sanitizePath(value, options) : sanitizeText(value, options);
  }
  if (Array.isArray(value)) {
    if (seen.has(value)) return value;
    seen.add(value);
    return value.map((item) => sanitizeValue(item, options, seen));
  }
  if (isRecord(value)) {
    if (seen.has(value)) return value;
    seen.add(value);
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeValue(item, options, seen)])
    );
  }
  return value;
}

function formatLocation(location: SourceLocation, options: PathOutputOptions): string {
  return `${sanitizePath(location.file, options)}:${location.line}:${location.column}`;
}

function sanitizeTrace(trace: ProvenanceTrace, options: PathOutputOptions): ProvenanceTrace {
  return {
    ...trace,
    entry: sanitizePath(trace.entry, options),
    entries: trace.entries.map((entry) => ({
      ...entry,
      source: { ...entry.source, file: sanitizePath(entry.source.file, options) },
      history: entry.history.map((step) => ({
        ...step,
        source: { ...step.source, file: sanitizePath(step.source.file, options) },
        ...(step.target ? { target: sanitizeReference(step.target, options) } : {}),
        ...(step.reference ? { reference: sanitizeReference(step.reference, options) } : {}),
        chain: step.chain.map((link) => ({
          ...link,
          source: { ...link.source, file: sanitizePath(link.source.file, options) },
          ...(link.target ? { target: sanitizeReference(link.target, options) } : {}),
          ...(link.reference ? { reference: sanitizeReference(link.reference, options) } : {}),
        })),
        ...(step.trace ? { trace: sanitizeTrace(step.trace, options) } : {}),
      })),
    })),
  };
}

function sanitizeEntry(entry: ProvenanceEntry, options: PathOutputOptions): ProvenanceEntry {
  return sanitizeTrace({ version: 1, entry: '<entry>', entries: [entry] }, options).entries[0]!;
}

function formatValue(value: unknown, options: PathOutputOptions): string {
  if (value === undefined) return '(unavailable)';
  const sanitizedValue = sanitizeValue(value, options);
  if (typeof sanitizedValue === 'string') return sanitizedValue;
  try {
    return JSON.stringify(sanitizedValue, null, 2);
  } catch {
    return sanitizeText(String(sanitizedValue), options);
  }
}

function outputText(
  requestedPath: string,
  matches: readonly ExplainMatch[],
  diagnostics: readonly ExplainDiagnostic[],
  options: PathOutputOptions
): void {
  console.log(`\nPath: ${requestedPath}\n`);
  for (const match of matches) {
    const entry = sanitizeEntry(match.entry, options);
    console.log(`${entry.path} (${entry.kind})`);
    console.log(`  final: ${formatValue(match.value, options)}`);
    console.log(`  source: ${formatLocation(entry.source, options)}`);
    for (const step of entry.history) {
      const strategy = step.strategy ? `, ${step.strategy}` : '';
      const target = step.target ? `, target ${sanitizeReference(step.target, options)}` : '';
      console.log(
        `  ${step.operation}/${step.action}${strategy}${target} <- ${formatLocation(step.source, options)}`
      );
      for (const link of step.chain) {
        console.log(`    via ${link.operation} <- ${formatLocation(link.source, options)}`);
      }
    }
    console.log('');
  }
  if (diagnostics.length > 0) {
    console.log('Diagnostics:');
    for (const diagnostic of diagnostics) {
      const location = diagnostic.location
        ? ` (${formatLocation(diagnostic.location, options)})`
        : '';
      const related =
        diagnostic.relatedPaths && diagnostic.relatedPaths.length > 0
          ? ` -> ${diagnostic.relatedPaths.join(', ')}`
          : '';
      console.log(`  ${sanitizeText(diagnostic.message, options)}${location}${related}`);
    }
  }
}

function outputJson(
  requestedPath: string,
  matches: readonly ExplainMatch[],
  diagnostics: readonly ExplainDiagnostic[],
  options: PathOutputOptions
): void {
  console.log(
    JSON.stringify(
      {
        version: 1,
        path: requestedPath,
        entries: matches.map((match) => ({
          ...sanitizeEntry(match.entry, options),
          value: formatValue(match.value, options),
        })),
        diagnostics: diagnostics.map((diagnostic) => ({
          ...diagnostic,
          ...(diagnostic.location
            ? {
                location: {
                  ...diagnostic.location,
                  file: sanitizePath(diagnostic.location.file, options),
                },
              }
            : {}),
          message: sanitizeText(diagnostic.message, options),
        })),
      },
      null,
      2
    )
  );
}

function sameLocation(left: SourceLocation, right: SourceLocation): boolean {
  return (
    left.file === right.file &&
    left.line === right.line &&
    left.column === right.column &&
    left.offset === right.offset
  );
}

/**
 * Explain source and composition provenance for any resolved AST path.
 */
export async function explainCommand(targetPath: string, options: ExplainOptions): Promise<void> {
  const isJson = options.format === 'json';
  const spinner = isJson ? createSpinner('').stop() : createSpinner('Resolving...').start();
  const outputOptions: PathOutputOptions = {
    projectRoot: resolve(options.cwd ?? process.cwd()),
    absolutePaths: options.absolutePaths === true,
  };

  try {
    const projectRoot = outputOptions.projectRoot;
    const configPath = options.config
      ? resolve(projectRoot, options.config)
      : options.cwd
        ? CONFIG_FILES.map((file) => resolve(projectRoot, file)).find((file) => existsSync(file))
        : undefined;
    if (options.cwd && !configPath) {
      throw new Error(`No PromptScript configuration found in ${projectRoot}. Run: prs init`);
    }

    const config = await loadConfig(configPath);
    const registry = await resolveRegistryPath(config);
    const resolver = new Resolver({
      registryPath: registry.isRemote ? registry.path : resolve(projectRoot, registry.path),
      localPath: resolve(projectRoot, '.promptscript'),
      projectRoot,
      registries: config.registries,
    });
    const entryPath = resolve(projectRoot, config.input?.entry ?? '.promptscript/project.prs');

    if (!existsSync(entryPath)) {
      spinner.stop();
      ConsoleOutput.error(`Entry file not found: ${sanitizePath(entryPath, outputOptions)}`);
      process.exitCode = 1;
      return;
    }

    const result = await resolver.resolve(entryPath);
    if (!result.ast) {
      spinner.stop();
      ConsoleOutput.error('Resolution failed');
      for (const error of result.errors) {
        ConsoleOutput.error(`  ${sanitizeText(error.message, outputOptions)}`);
      }
      process.exitCode = 1;
      return;
    }

    spinner.stop();
    const requestedPath = normalizePath(targetPath);
    const trace = traceForResult(result.ast, result.provenance, entryPath);
    const matches = findMatches(result.ast, trace, requestedPath);
    const diagnostics = result.errors.map((error): ExplainDiagnostic => {
      const relatedPaths = error.location
        ? matches
            .filter((match) =>
              match.entry.history.some((step) => sameLocation(step.source, error.location!))
            )
            .map((match) => match.entry.path)
        : [];
      return {
        message: error.message,
        ...(error.location ? { location: error.location } : {}),
        ...(relatedPaths.length > 0 ? { relatedPaths } : {}),
      };
    });

    if (matches.length === 0) {
      ConsoleOutput.error(`Path '${targetPath}' not found in resolved output`);
      process.exitCode = 1;
      return;
    }

    if (isJson) outputJson(requestedPath, matches, diagnostics, outputOptions);
    else outputText(requestedPath, matches, diagnostics, outputOptions);
    if (diagnostics.some((diagnostic) => !isWarningDiagnostic(diagnostic))) {
      process.exitCode = 1;
    }
  } catch (error) {
    spinner.stop();
    ConsoleOutput.error(
      `Explain failed: ${sanitizeText(
        error instanceof Error ? error.message : String(error),
        outputOptions
      )}`
    );
    process.exitCode = 1;
  }
}

function isWarningDiagnostic(diagnostic: ExplainDiagnostic): boolean {
  return /\bwarn(?:ing)?\b/i.test(diagnostic.message);
}
