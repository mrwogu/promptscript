import { createHash } from 'node:crypto';
import { lstat, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { FormatterOutput } from '@promptscript/compiler';
import { compareCodeUnits } from '@promptscript/core';
import { isHookOutputPath } from './managed-output-cleanup.js';

/** File name of the generated files manifest, written in the output directory. */
export const GENERATED_MANIFEST_FILE = '.promptscript-generated.json';

/** One generated file in the manifest. */
export interface GeneratedManifestEntry {
  /** SHA-256 of the file content as written */
  sha256: string;
  /** Target that generated the file */
  target?: string;
  /** Build profile that generated the file */
  build?: string;
}

/** Manifest of the files PromptScript generated in one output directory. */
export interface GeneratedManifest {
  version: 1;
  /** Entries by output path, relative to the output directory */
  files: Record<string, GeneratedManifestEntry>;
}

/** What one compile run covers: a build profile and its targets. */
export interface ManifestScope {
  /** Build profile, undefined for the default project compile */
  build?: string;
  /** Compiled targets, undefined when all configured targets are compiled */
  targets?: ReadonlySet<string>;
}

/** Hash file content the way the manifest stores it. */
export function hashContent(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Whether a planned output goes into the manifest. Hook files can be merged
 * with entries of the user, so the existing hook ownership rules handle them.
 */
export function isManifestTracked(output: FormatterOutput): boolean {
  return output.merge === undefined && !isHookOutputPath(output.path);
}

/**
 * Read the manifest of an output directory. A missing or unreadable manifest
 * gives undefined, so a broken file never makes the compile delete anything.
 */
export async function readGeneratedManifest(
  outputRoot: string
): Promise<GeneratedManifest | undefined> {
  let raw: string;
  try {
    raw = await readFile(resolve(outputRoot, GENERATED_MANIFEST_FILE), 'utf-8');
  } catch {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed['version'] !== 1 || !isRecord(parsed['files'])) {
      return undefined;
    }
    const files: Record<string, GeneratedManifestEntry> = {};
    for (const [path, value] of Object.entries(parsed['files'])) {
      if (!isRecord(value) || typeof value['sha256'] !== 'string') continue;
      files[path] = {
        sha256: value['sha256'],
        ...(typeof value['target'] === 'string' ? { target: value['target'] } : {}),
        ...(typeof value['build'] === 'string' ? { build: value['build'] } : {}),
      };
    }
    return { version: 1, files };
  } catch {
    return undefined;
  }
}

/** Render a manifest with sorted paths, so equal content gives equal bytes. */
export function renderGeneratedManifest(files: Record<string, GeneratedManifestEntry>): string {
  const sorted: Record<string, GeneratedManifestEntry> = {};
  for (const path of Object.keys(files).sort(compareCodeUnits)) {
    const entry = files[path]!;
    sorted[path] = {
      sha256: entry.sha256,
      ...(entry.target !== undefined ? { target: entry.target } : {}),
      ...(entry.build !== undefined ? { build: entry.build } : {}),
    };
  }
  return `${JSON.stringify({ version: 1, files: sorted }, null, 2)}\n`;
}

/** Whether a manifest entry belongs to the files this run generates. */
export function isInScope(entry: GeneratedManifestEntry, scope: ManifestScope): boolean {
  if (entry.build !== scope.build) return false;
  if (scope.targets === undefined) return true;
  return entry.target !== undefined && scope.targets.has(entry.target);
}

/**
 * Whether a file on disk is still the one PromptScript wrote, by the manifest.
 *
 * @param manifest - Manifest of the output directory
 * @param path - Output path, relative to the output directory
 * @param content - Current file content
 */
export function isOwnedByManifest(
  manifest: GeneratedManifest | undefined,
  path: string,
  content: string
): boolean {
  const entry = manifest?.files[path];
  return entry !== undefined && entry.sha256 === hashContent(content);
}

/** Stale files of a previous run, split by whether they were edited since. */
export interface StaleManifestFiles {
  /** Unchanged since generated: safe to remove */
  unchanged: string[];
  /** Edited by hand since generated: kept and reported */
  edited: string[];
}

/**
 * Find files listed in the previous manifest, in the scope of this run, that
 * this run no longer generates and that still exist.
 *
 * @param manifest - Previous manifest
 * @param plannedPaths - Output paths of this run
 * @param outputRoot - Absolute output directory
 * @param scope - Build and targets of this run
 */
export async function findStaleManifestFiles(
  manifest: GeneratedManifest | undefined,
  plannedPaths: ReadonlySet<string>,
  outputRoot: string,
  scope: ManifestScope
): Promise<StaleManifestFiles> {
  const stale: StaleManifestFiles = { unchanged: [], edited: [] };
  if (!manifest) return stale;
  for (const path of Object.keys(manifest.files).sort(compareCodeUnits)) {
    const entry = manifest.files[path]!;
    if (plannedPaths.has(path) || !isInScope(entry, scope)) continue;
    const absolutePath = resolve(outputRoot, path);
    const stat = await lstat(absolutePath).catch(() => undefined);
    if (!stat?.isFile()) continue;
    const content = await readFile(absolutePath);
    if (hashContent(content) === entry.sha256) {
      stale.unchanged.push(path);
    } else {
      stale.edited.push(path);
    }
  }
  return stale;
}

/**
 * Build the next manifest: entries of other builds and targets stay, entries
 * of this run are the files it generated, hashed as they are on disk now, and
 * stale files that were edited stay listed until someone deletes them.
 *
 * @param previous - Previous manifest
 * @param generated - Generated outputs of this run that exist on disk
 * @param outputRoot - Absolute output directory
 * @param scope - Build and targets of this run
 * @param keptStale - Stale paths that were kept because they were edited
 */
export async function buildGeneratedManifest(
  previous: GeneratedManifest | undefined,
  generated: readonly FormatterOutput[],
  outputRoot: string,
  scope: ManifestScope,
  keptStale: readonly string[]
): Promise<Record<string, GeneratedManifestEntry>> {
  const files: Record<string, GeneratedManifestEntry> = {};
  const kept = new Set(keptStale);
  for (const [path, entry] of Object.entries(previous?.files ?? {})) {
    if (!isInScope(entry, scope) || kept.has(path)) files[path] = entry;
  }
  for (const output of generated) {
    if (!isManifestTracked(output) || output.path === GENERATED_MANIFEST_FILE) continue;
    const absolutePath = resolve(outputRoot, output.path);
    const stat = await lstat(absolutePath).catch(() => undefined);
    if (!stat?.isFile()) continue;
    files[output.path] = {
      sha256: hashContent(await readFile(absolutePath)),
      ...(output.target !== undefined ? { target: output.target } : {}),
      ...(scope.build !== undefined ? { build: scope.build } : {}),
    };
  }
  return files;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
