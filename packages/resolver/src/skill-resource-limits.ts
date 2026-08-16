import { ResolveError } from '@promptscript/core';
import type { SourceLocation } from '@promptscript/core';

/** Maximum size in bytes for a single skill resource file. */
export const MAX_RESOURCE_SIZE = 1_048_576;

/** Maximum total size in bytes for all resource files in a skill. */
export const MAX_TOTAL_RESOURCE_SIZE = 10_485_760;

/** Maximum number of resource files per skill. */
export const MAX_RESOURCE_COUNT = 100;

export interface SkillResourceLimitResult<T> {
  resources: T[];
  errors: ResolveError[];
}

/**
 * Apply aggregate limits after all resource sources have been deduplicated.
 *
 * @param resources - Deduplicated resources in output priority order
 * @param location - Source location for actionable diagnostics
 * @returns Resources within the limits and any limit errors
 */
export function limitSkillResources<T extends { content: string; relativePath: string }>(
  resources: readonly T[],
  location: SourceLocation
): SkillResourceLimitResult<T> {
  const errors: ResolveError[] = [];
  const sizedResources: Array<{ resource: T; size: number }> = [];
  for (const resource of resources) {
    const size = Buffer.byteLength(resource.content, 'utf8');
    if (size > MAX_RESOURCE_SIZE) {
      errors.push(
        new ResolveError(
          `Skill resource file exceeds ${MAX_RESOURCE_SIZE / 1_048_576}MB limit: ${resource.relativePath}`,
          location
        )
      );
      continue;
    }
    sizedResources.push({ resource, size });
  }

  if (sizedResources.length > MAX_RESOURCE_COUNT) {
    errors.push(
      new ResolveError(
        `Too many skill resource files (${sizedResources.length}, max ${MAX_RESOURCE_COUNT})`,
        location
      )
    );
  }

  const limitedResources: T[] = [];
  let totalSize = 0;
  for (const { resource, size } of sizedResources.slice(0, MAX_RESOURCE_COUNT)) {
    if (totalSize + size > MAX_TOTAL_RESOURCE_SIZE) {
      errors.push(
        new ResolveError(
          `Total skill resource size exceeds ${MAX_TOTAL_RESOURCE_SIZE / 1_048_576}MB limit`,
          location
        )
      );
      break;
    }
    totalSize += size;
    limitedResources.push(resource);
  }

  return { resources: limitedResources, errors };
}
