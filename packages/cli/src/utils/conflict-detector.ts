import type { TargetConfig } from '@promptscript/core';
import { DEFAULT_OUTPUT_PATHS } from '@promptscript/core';

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
