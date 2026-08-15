import type { TargetConfig } from '@promptscript/core';
import { DEFAULT_OUTPUT_PATHS, isKnownTarget } from '@promptscript/core';
import * as fs from 'fs';
import { basename, dirname, resolve, relative, isAbsolute, sep } from 'path';

/**
 * Detect output path conflicts: multiple targets writing to the same file.
 * Returns a map of conflicting paths to the list of target names that write to them.
 */
export function detectOutputConflicts(
  targets: { name: string; config?: TargetConfig }[]
): Map<string, string[]> {
  const pathMap = new Map<string, string[]>();

  for (const target of targets) {
    const defaultOutputPath = isKnownTarget(target.name)
      ? DEFAULT_OUTPUT_PATHS[target.name]
      : undefined;
    const outputPath = target.config?.output ?? defaultOutputPath ?? target.name;
    const existing = pathMap.get(outputPath) ?? [];
    existing.push(target.name);
    pathMap.set(outputPath, existing);
  }

  const conflicts = new Map<string, string[]>();
  for (const [path, names] of pathMap) {
    if (names.length > 1) {
      conflicts.set(path, names);
    }
  }
  return conflicts;
}

/**
 * Validate that an output path stays inside the directory it is written to.
 * Returns an error message if invalid, or undefined if valid.
 */
export function validateOutputPath(outputPath: string, outputRoot: string): string | undefined {
  const resolved = resolveOutputPath(outputPath, outputRoot);
  const root = resolve(outputRoot);
  const rel = relative(root, resolved);

  if (!isPathContained(rel, false)) {
    return `Output path "${outputPath}" escapes the output directory ${outputRoot}`;
  }

  try {
    // Lexical paths can cross a symlink, so compare resolved filesystem paths too.
    const realRoot = resolveThroughExistingAncestor(root);
    const realResolved = resolveThroughExistingAncestor(resolved);
    if (!isPathContained(relative(realRoot, realResolved), false)) {
      return `Output path "${outputPath}" escapes the output directory ${outputRoot}`;
    }
  } catch {
    return `Output path "${outputPath}" cannot be verified inside the output directory ${outputRoot}`;
  }

  return undefined;
}

/**
 * Check directory containment while allowing the directory itself.
 */
export function isPathInsideDir(dir: string, root: string): boolean {
  const rel = relative(resolve(root), resolveOutputPath(dir, root));
  return isPathContained(rel, true);
}

function isPathContained(rel: string, allowEqual: boolean): boolean {
  return (
    (allowEqual && rel === '') ||
    (rel !== '' && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
  );
}

function resolveThroughExistingAncestor(path: string): string {
  const missingSegments: string[] = [];
  let current = path;

  while (true) {
    try {
      fs.lstatSync(current);
      break;
    } catch (error: unknown) {
      if (
        typeof error !== 'object' ||
        error === null ||
        !('code' in error) ||
        error.code !== 'ENOENT'
      ) {
        throw error;
      }
    }

    const parent = dirname(current);
    if (parent === current) {
      throw new Error(`No existing ancestor for ${path}`);
    }
    missingSegments.unshift(basename(current));
    current = parent;
  }

  return resolve(fs.realpathSync.native(current), ...missingSegments);
}

/**
 * Detect collisions across build profile outputs.
 * Returns a map of conflicting paths to the list of profile names.
 */
export function detectBuildOutputCollisions(
  profiles: Map<string, string[]>
): Map<string, string[]> {
  const conflicts = new Map<string, string[]>();
  for (const [path, names] of profiles) {
    if (names.length > 1) {
      conflicts.set(path, names);
    }
  }
  return conflicts;
}

/**
 * Resolve an output path relative to the project root.
 * Ensures the path stays within the project.
 */
export function resolveOutputPath(outputPath: string, projectRoot: string): string {
  if (isAbsolute(outputPath)) {
    return outputPath;
  }
  return resolve(projectRoot, outputPath);
}
