import type { TargetConfig } from '@promptscript/core';
import { DEFAULT_OUTPUT_PATHS } from '@promptscript/core';
import { resolve, relative, isAbsolute } from 'path';

/**
 * Detect output path conflicts: multiple targets writing to the same file.
 * Returns a map of conflicting paths to the list of target names that write to them.
 */
export function detectOutputConflicts(
  targets: { name: string; config?: TargetConfig }[]
): Map<string, string[]> {
  const pathMap = new Map<string, string[]>();

  for (const target of targets) {
    const outputPath = target.config?.output ?? DEFAULT_OUTPUT_PATHS[target.name] ?? target.name;
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
 * Validate that an output path is project-relative and does not contain traversal.
 * Returns an error message if invalid, or undefined if valid.
 */
export function validateOutputPath(outputPath: string, projectRoot?: string): string | undefined {
  // Reject absolute paths that escape the project root
  if (isAbsolute(outputPath) && projectRoot) {
    const rel = relative(projectRoot, outputPath);
    if (rel.startsWith('..') || isAbsolute(rel)) {
      return `Output path "${outputPath}" escapes project root`;
    }
  }

  // Reject path traversal patterns
  if (outputPath.includes('..')) {
    return `Output path "${outputPath}" contains path traversal`;
  }

  return undefined;
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
