import { createHash } from 'node:crypto';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import type { CompileError, CompileResult, FormatterOutput } from '@promptscript/compiler';
import {
  cleanupManagedOutputs,
  isPromptScriptOwnedHookOutput,
  mergePromptScriptCodexConfig,
  mergePromptScriptHookOutput,
  removePromptScriptOwnedCodexHooks,
} from './managed-output-cleanup.js';
import { stripMarkers } from './markers.js';
import { isPromptScriptOwnedOutput } from './output-ownership.js';

export const DIFF_SCHEMA_VERSION = 1 as const;
export const DIFF_SCHEMA_URL = 'https://getpromptscript.dev/schema/diff/v1.json';

export type DiffChangeKind = 'added' | 'changed' | 'removed' | 'unsupported' | 'user-owned';

export type DiffOwnership = 'promptscript' | 'user' | 'unknown';

export interface DiffLocation {
  file?: string;
  line?: number;
  column?: number;
}

export interface DiffWarning {
  code: string;
  message: string;
  suggestion?: string;
  location?: DiffLocation;
}

export interface CompilationDiffChange {
  target: string;
  path: string;
  source: string;
  kind: DiffChangeKind;
  ownership: DiffOwnership;
  contentHash?: string;
  content?: string;
  warnings?: DiffWarning[];
  location?: DiffLocation;
}

export interface CompilationDiffSummary {
  total: number;
  added: number;
  changed: number;
  removed: number;
  unsupported: number;
  userOwned: number;
  unchanged: number;
}

export interface CompilationDiffReport {
  $schema: typeof DIFF_SCHEMA_URL;
  version: typeof DIFF_SCHEMA_VERSION;
  contentIncluded: boolean;
  success: boolean;
  hasChanges: boolean;
  changes: CompilationDiffChange[];
  unsupported: CompilationDiffChange[];
  warnings: DiffWarning[];
  errors: Array<{
    name?: string;
    code?: string;
    message: string;
    location?: DiffLocation;
  }>;
  summary: CompilationDiffSummary;
}

export interface BuildCompilationDiffOptions {
  projectRoot: string;
  outputRoot: string;
  entryPath: string;
  outputs: Map<string, FormatterOutput>;
  warnings: CompileResult['warnings'];
  includeContent?: boolean;
}

interface MarkerMetadata {
  source?: string;
  target?: string;
}

const CHANGE_KIND_ORDER: Record<DiffChangeKind, number> = {
  added: 0,
  changed: 1,
  removed: 2,
  unsupported: 3,
  'user-owned': 4,
};

function compareStrings(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function normalizePath(path: string): string {
  return path.replaceAll('\\', '/');
}

function reportPath(outputRoot: string, path: string): string {
  const absolutePath = resolve(outputRoot, path);
  const relation = normalizePath(relative(outputRoot, absolutePath));
  if (!relation || relation === '.') return normalizePath(path);
  if (relation === '..' || relation.startsWith('../') || isAbsolute(relation)) {
    return normalizePath(path);
  }
  return relation;
}

function reportSource(projectRoot: string, source: string): string {
  const normalized = normalizePath(source);
  if (!isAbsolute(source)) return normalized;

  const relation = normalizePath(relative(projectRoot, source));
  if (relation && relation !== '..' && !relation.startsWith('../') && !isAbsolute(relation)) {
    return relation;
  }
  return normalized;
}

function parseMarkerMetadata(content: string): MarkerMetadata {
  for (const line of content.split(/\r?\n/).slice(0, 5)) {
    const htmlMatch =
      /^<!-- PromptScript .+ \| source: (.+?) \| target: (.+?) - do not edit -->$/.exec(line);
    if (htmlMatch) {
      return { source: htmlMatch[1], target: htmlMatch[2] };
    }

    const yamlMatch = /^# promptscript-generated: .+ \| source: (.+?) \| target: (.+?)$/.exec(line);
    if (yamlMatch) {
      return { source: yamlMatch[1], target: yamlMatch[2] };
    }
  }
  return {};
}

function canonicalContent(content: string): string {
  return stripMarkers(content);
}

function contentHash(content: string): string {
  return `sha256-${createHash('sha256').update(canonicalContent(content), 'utf8').digest('hex')}`;
}

function normalizeLocation(
  location: { file?: string; line?: number; column?: number } | undefined,
  projectRoot: string
): DiffLocation | undefined {
  if (!location) return undefined;
  return {
    ...(location.file ? { file: reportSource(projectRoot, location.file) } : {}),
    ...(location.line !== undefined ? { line: location.line } : {}),
    ...(location.column !== undefined ? { column: location.column } : {}),
  };
}

function normalizeWarning(
  warning: {
    code?: string;
    ruleId?: string;
    message: string;
    suggestion?: string;
    location?: { file?: string; line?: number; column?: number };
  },
  projectRoot: string
): DiffWarning {
  const location = normalizeLocation(warning.location, projectRoot);
  return {
    code: warning.code ?? warning.ruleId ?? 'PS0000',
    message: warning.message,
    ...(warning.suggestion ? { suggestion: warning.suggestion } : {}),
    ...(location ? { location } : {}),
  };
}

function normalizeError(
  error: CompileError,
  projectRoot: string
): CompilationDiffReport['errors'][number] {
  const location = normalizeLocation(error.location, projectRoot);
  return {
    ...(error.name ? { name: error.name } : {}),
    ...(error.code ? { code: error.code } : {}),
    message: error.message,
    ...(location ? { location } : {}),
  };
}

function outputIdentity(
  output: FormatterOutput,
  entryPath: string,
  projectRoot: string
): { target: string; source: string } {
  const marker = parseMarkerMetadata(output.content);
  return {
    target: output.target ?? marker.target ?? 'unknown',
    source: reportSource(projectRoot, output.source ?? marker.source ?? entryPath),
  };
}

function isOwnedOutput(path: string, content: string): boolean {
  return isPromptScriptOwnedOutput(path, content);
}

/**
 * Reproduce compile's safe merge decision without writing the merged result.
 *
 * Hook and Codex settings outputs can preserve user-owned configuration while
 * still being safely updated by `prs compile`. Diff must compare that merged
 * candidate, not the formatter's generated fragment.
 */
function getPlannedContent(
  output: FormatterOutput,
  existingContent: string | undefined
): { content: string; safelyWritable: boolean } {
  if (existingContent === undefined) {
    return { content: output.content, safelyWritable: true };
  }

  const existingHookOutputOwned = isPromptScriptOwnedHookOutput(output.path, existingContent);
  const prunedCodexConfig = removePromptScriptOwnedCodexHooks(output.path, existingContent);
  const migratedCodexContent =
    prunedCodexConfig === undefined
      ? undefined
      : prunedCodexConfig.empty
        ? output.content
        : mergePromptScriptCodexConfig(prunedCodexConfig.content, output.content);
  const mergedHookContent = existingHookOutputOwned
    ? undefined
    : (mergePromptScriptHookOutput(output.path, existingContent, output.content) ??
      migratedCodexContent);

  return {
    content: mergedHookContent ?? output.content,
    safelyWritable:
      existingHookOutputOwned ||
      mergedHookContent !== undefined ||
      isOwnedOutput(output.path, existingContent),
  };
}

function sortChanges(changes: CompilationDiffChange[]): void {
  changes.sort((left, right) => {
    const pathOrder = compareStrings(left.path, right.path);
    if (pathOrder !== 0) return pathOrder;
    const targetOrder = compareStrings(left.target, right.target);
    if (targetOrder !== 0) return targetOrder;
    const kindOrder = CHANGE_KIND_ORDER[left.kind] - CHANGE_KIND_ORDER[right.kind];
    if (kindOrder !== 0) return kindOrder;
    const leftWarning = left.warnings?.[0];
    const rightWarning = right.warnings?.[0];
    const codeOrder = compareStrings(leftWarning?.code ?? '', rightWarning?.code ?? '');
    if (codeOrder !== 0) return codeOrder;
    const messageOrder = compareStrings(leftWarning?.message ?? '', rightWarning?.message ?? '');
    if (messageOrder !== 0) return messageOrder;
    const fileOrder = compareStrings(left.location?.file ?? '', right.location?.file ?? '');
    if (fileOrder !== 0) return fileOrder;
    const lineOrder = (left.location?.line ?? 0) - (right.location?.line ?? 0);
    if (lineOrder !== 0) return lineOrder;
    return (left.location?.column ?? 0) - (right.location?.column ?? 0);
  });
}

function sortWarnings(warnings: DiffWarning[]): void {
  warnings.sort((left, right) => {
    const codeOrder = compareStrings(left.code, right.code);
    if (codeOrder !== 0) return codeOrder;
    const messageOrder = compareStrings(left.message, right.message);
    if (messageOrder !== 0) return messageOrder;
    const fileOrder = compareStrings(left.location?.file ?? '', right.location?.file ?? '');
    if (fileOrder !== 0) return fileOrder;
    const lineOrder = (left.location?.line ?? 0) - (right.location?.line ?? 0);
    if (lineOrder !== 0) return lineOrder;
    return (left.location?.column ?? 0) - (right.location?.column ?? 0);
  });
}

function warningKey(warning: DiffWarning): string {
  return [
    warning.code,
    warning.message,
    warning.location?.file ?? '',
    warning.location?.line ?? '',
    warning.location?.column ?? '',
  ].join('\0');
}

function createSummary(
  changes: CompilationDiffChange[],
  unchanged: number
): CompilationDiffSummary {
  return {
    total: changes.length,
    added: changes.filter((change) => change.kind === 'added').length,
    changed: changes.filter((change) => change.kind === 'changed').length,
    removed: changes.filter((change) => change.kind === 'removed').length,
    unsupported: changes.filter((change) => change.kind === 'unsupported').length,
    userOwned: changes.filter((change) => change.kind === 'user-owned').length,
    unchanged,
  };
}

function sortErrors(errors: CompilationDiffReport['errors']): void {
  errors.sort((left, right) => {
    const codeOrder = compareStrings(left.code ?? '', right.code ?? '');
    if (codeOrder !== 0) return codeOrder;
    const messageOrder = compareStrings(left.message, right.message);
    if (messageOrder !== 0) return messageOrder;
    const fileOrder = compareStrings(left.location?.file ?? '', right.location?.file ?? '');
    if (fileOrder !== 0) return fileOrder;
    const lineOrder = (left.location?.line ?? 0) - (right.location?.line ?? 0);
    if (lineOrder !== 0) return lineOrder;
    return (left.location?.column ?? 0) - (right.location?.column ?? 0);
  });
}

function createReport(
  success: boolean,
  changes: CompilationDiffChange[],
  warnings: DiffWarning[],
  errors: CompilationDiffReport['errors'],
  includeContent: boolean,
  unchanged: number
): CompilationDiffReport {
  sortChanges(changes);
  sortWarnings(warnings);
  sortErrors(errors);
  const unsupported = changes.filter((change) => change.kind === 'unsupported');
  return {
    $schema: DIFF_SCHEMA_URL,
    version: DIFF_SCHEMA_VERSION,
    contentIncluded: includeContent,
    success,
    hasChanges: changes.length > 0,
    changes,
    unsupported,
    warnings,
    errors,
    summary: createSummary(changes, unchanged),
  };
}

function findManagedOutputOwner(
  removedPath: string,
  outputs: Map<string, FormatterOutput>,
  outputRoot: string,
  entryPath: string,
  projectRoot: string
): { target: string; source: string } | undefined {
  const candidate = resolve(removedPath);

  for (const output of outputs.values()) {
    const managedFile = (output.managedOutputFiles ?? []).some(
      (file) => resolve(outputRoot, file) === candidate
    );
    const managedDirectory = (directory: string): boolean => {
      const directoryPath = resolve(outputRoot, directory);
      const relation = relative(directoryPath, candidate);
      return (
        relation === '' ||
        (relation !== '..' && !relation.startsWith(`..${sep}`) && !isAbsolute(relation))
      );
    };

    if (managedFile || (output.managedOutputDirectories ?? []).some(managedDirectory)) {
      return outputIdentity(output, entryPath, projectRoot);
    }
  }

  return undefined;
}

export function createCompilationDiffErrorReport(
  errors: CompileError[],
  warnings: CompileResult['warnings'],
  projectRoot: string,
  includeContent = false
): CompilationDiffReport {
  return createReport(
    false,
    [],
    warnings.map((warning) => normalizeWarning(warning, projectRoot)),
    errors.map((error) => normalizeError(error, projectRoot)),
    includeContent,
    0
  );
}

export async function buildCompilationDiff(
  options: BuildCompilationDiffOptions
): Promise<CompilationDiffReport> {
  const projectRoot = resolve(options.projectRoot);
  const outputRoot = resolve(options.outputRoot);
  const includeContent = options.includeContent === true;
  const changes: CompilationDiffChange[] = [];
  const warnings = options.warnings.map((warning) => normalizeWarning(warning, projectRoot));
  const warningKeys = new Set(warnings.map(warningKey));
  let unchanged = 0;

  for (const output of options.outputs.values()) {
    const identity = outputIdentity(output, options.entryPath, projectRoot);
    const path = reportPath(outputRoot, output.path);
    const outputPath = resolve(outputRoot, output.path);
    const desiredContent = output.content;
    const common = {
      target: identity.target,
      path,
      source: identity.source,
      ownership: 'promptscript' as const,
      contentHash: contentHash(desiredContent),
      ...(includeContent ? { content: canonicalContent(desiredContent) } : {}),
    };

    if (!existsSync(outputPath)) {
      changes.push({ ...common, kind: 'added' });
    } else {
      let existingContent: string | undefined;
      try {
        existingContent = await readFile(outputPath, 'utf8');
      } catch (error) {
        changes.push({
          ...common,
          kind: 'user-owned',
          ownership: 'unknown',
          warnings: [
            {
              code: 'DIFF0001',
              message: `Could not read existing output '${path}': ${
                error instanceof Error ? error.message : String(error)
              }`,
            },
          ],
        });
      }

      const planned = getPlannedContent(output, existingContent);
      if (
        existingContent !== undefined &&
        canonicalContent(existingContent) === canonicalContent(planned.content)
      ) {
        unchanged++;
      } else if (existingContent !== undefined) {
        const owned = planned.safelyWritable;
        changes.push({
          ...common,
          kind: owned ? 'changed' : 'user-owned',
          ownership: owned && isOwnedOutput(output.path, existingContent) ? 'promptscript' : 'user',
        });
      }
    }

    for (const warning of output.warnings ?? []) {
      const normalizedWarning = normalizeWarning(warning, projectRoot);
      if (!warningKeys.has(warningKey(normalizedWarning))) {
        warningKeys.add(warningKey(normalizedWarning));
        warnings.push(normalizedWarning);
      }
      const location = normalizedWarning.location;
      changes.push({
        ...common,
        kind: 'unsupported',
        warnings: [normalizedWarning],
        ...(location ? { location } : {}),
        ...(location?.file ? { source: location.file } : {}),
      });
    }
  }

  const hasManagedMetadata = [...options.outputs.values()].some(
    (output) =>
      (output.managedOutputDirectories?.length ?? 0) > 0 ||
      (output.managedOutputFiles?.length ?? 0) > 0
  );
  if (hasManagedMetadata) {
    const cleanup = await cleanupManagedOutputs(options.outputs, {
      outputRoot,
      dryRun: true,
    });
    for (const removedPath of cleanup.removed) {
      let existingContent = '';
      try {
        existingContent = await readFile(removedPath, 'utf8');
      } catch {
        // A file can disappear between the read-only cleanup scan and report.
      }
      const marker = parseMarkerMetadata(existingContent);
      const owner = findManagedOutputOwner(
        removedPath,
        options.outputs,
        outputRoot,
        options.entryPath,
        projectRoot
      );
      changes.push({
        target: owner?.target ?? marker.target ?? 'unknown',
        path: reportPath(outputRoot, removedPath),
        source: reportSource(projectRoot, marker.source ?? owner?.source ?? options.entryPath),
        kind: 'removed',
        ownership: 'promptscript',
        ...(existingContent ? { contentHash: contentHash(existingContent) } : {}),
        ...(includeContent && existingContent
          ? { content: canonicalContent(existingContent) }
          : {}),
      });
    }
  }

  return createReport(true, changes, warnings, [], includeContent, unchanged);
}
