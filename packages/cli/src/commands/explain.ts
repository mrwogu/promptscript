import { existsSync } from 'fs';
import { resolve } from 'path';
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

function formatLocation(location: SourceLocation): string {
  return `${location.file}:${location.line}:${location.column}`;
}

function formatValue(value: unknown): string {
  if (value === undefined) return '(unavailable)';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function outputText(
  requestedPath: string,
  matches: readonly ExplainMatch[],
  diagnostics: readonly ExplainDiagnostic[]
): void {
  console.log(`\nPath: ${requestedPath}\n`);
  for (const match of matches) {
    console.log(`${match.entry.path} (${match.entry.kind})`);
    console.log(`  final: ${formatValue(match.value)}`);
    console.log(`  source: ${formatLocation(match.entry.source)}`);
    for (const step of match.entry.history) {
      const strategy = step.strategy ? `, ${step.strategy}` : '';
      const target = step.target ? `, target ${step.target}` : '';
      console.log(
        `  ${step.operation}/${step.action}${strategy}${target} <- ${formatLocation(step.source)}`
      );
      for (const link of step.chain) {
        console.log(`    via ${link.operation} <- ${formatLocation(link.source)}`);
      }
    }
    console.log('');
  }
  if (diagnostics.length > 0) {
    console.log('Diagnostics:');
    for (const diagnostic of diagnostics) {
      const location = diagnostic.location ? ` (${formatLocation(diagnostic.location)})` : '';
      const related =
        diagnostic.relatedPaths && diagnostic.relatedPaths.length > 0
          ? ` -> ${diagnostic.relatedPaths.join(', ')}`
          : '';
      console.log(`  ${diagnostic.message}${location}${related}`);
    }
  }
}

function outputJson(
  requestedPath: string,
  matches: readonly ExplainMatch[],
  diagnostics: readonly ExplainDiagnostic[]
): void {
  console.log(
    JSON.stringify(
      {
        version: 1,
        path: requestedPath,
        entries: matches.map((match) => ({
          ...match.entry,
          value: formatValue(match.value),
        })),
        diagnostics,
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

  try {
    const projectRoot = options.cwd ? resolve(options.cwd) : process.cwd();
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
      ConsoleOutput.error(`Entry file not found: ${entryPath}`);
      process.exitCode = 1;
      return;
    }

    const result = await resolver.resolve(entryPath);
    if (!result.ast) {
      spinner.stop();
      ConsoleOutput.error('Resolution failed');
      for (const error of result.errors) ConsoleOutput.error(`  ${error.message}`);
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

    if (isJson) outputJson(requestedPath, matches, diagnostics);
    else outputText(requestedPath, matches, diagnostics);
  } catch (error) {
    spinner.stop();
    ConsoleOutput.error(
      `Explain failed: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exitCode = 1;
  }
}
