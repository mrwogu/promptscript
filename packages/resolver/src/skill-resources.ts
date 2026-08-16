import { dirname } from 'path';
import { ResolveError } from '@promptscript/core';
import type { Logger, Value } from '@promptscript/core';
import {
  discoverSkillResources,
  getSkillFrontmatterLocations,
  resolveSkillReferences,
  resolveSkillScripts,
  type ParsedSkillMd,
  type SkillResource,
} from './skills.js';
import { limitSkillResources } from './skill-resource-limits.js';

/**
 * Resource files that belong to a SKILL.md, plus any problems found while
 * loading the explicitly declared ones.
 */
export interface CollectedSkillResources {
  /** Files to ship alongside the skill, deduplicated by relative path */
  resources: SkillResource[];
  /** Errors raised by `references:` / `scripts:` frontmatter entries */
  errors: ResolveError[];
}

/**
 * Collect every file that travels with a SKILL.md.
 *
 * Combines the three sources a skill can pull resources from: files discovered
 * alongside SKILL.md, `references:` frontmatter entries, and `scripts:`
 * frontmatter entries. Later entries win on a relative-path clash, so explicit
 * frontmatter overrides a discovered file.
 *
 * Discovery failures are logged and skipped; failures for explicitly declared
 * references and scripts are returned so callers can surface them.
 *
 * @param skillMdPath - Absolute path to the SKILL.md file
 * @param parsed - Parsed SKILL.md metadata
 * @param logger - Optional logger for reporting skipped files
 * @returns Deduplicated resources and any resource errors
 */
export async function collectSkillResources(
  skillMdPath: string,
  parsed: ParsedSkillMd,
  logger?: Logger
): Promise<CollectedSkillResources> {
  const skillDir = dirname(skillMdPath);
  const collected: SkillResource[] = [];
  const errors: ResolveError[] = [];

  try {
    collected.push(...(await discoverSkillResources(skillDir, logger, [skillMdPath])));
  } catch (err) {
    logger?.verbose(
      `Failed to discover skill resources in ${skillDir}: ${
        err instanceof Error ? err.message : String(err)
      }`
    );
  }

  const frontmatterLocations = getSkillFrontmatterLocations(parsed);

  if (parsed.references && parsed.references.length > 0) {
    try {
      collected.push(
        ...(await resolveSkillReferences(
          parsed.references,
          skillDir,
          logger,
          frontmatterLocations?.frontmatter,
          frontmatterLocations?.items.get('references')
        ))
      );
    } catch (err) {
      errors.push(toResolveError(err));
    }
  }

  if (parsed.scripts && parsed.scripts.length > 0) {
    try {
      collected.push(
        ...(await resolveSkillScripts(
          parsed.scripts,
          skillDir,
          logger,
          frontmatterLocations?.frontmatter,
          frontmatterLocations?.items.get('scripts')
        ))
      );
    } catch (err) {
      errors.push(toResolveError(err));
    }
  }

  // Deduplicate by relative path: explicit frontmatter overrides discovery.
  const byPath = new Map<string, SkillResource>();
  for (const resource of collected) {
    byPath.set(resource.relativePath, resource);
  }

  const location = frontmatterLocations?.frontmatter ?? {
    file: skillMdPath,
    line: 1,
    column: 1,
  };
  const limited = limitSkillResources([...byPath.values()], location);
  errors.push(...limited.errors);

  return { resources: limited.resources, errors };
}

/**
 * Convert resources into the AST value shape stored on a skill definition.
 *
 * @param resources - Resources collected for a skill
 * @returns Plain AST values ready to assign to the skill's `resources` property
 */
export function toSkillResourceValues(resources: readonly SkillResource[]): Value[] {
  return resources.map((resource) => ({
    relativePath: resource.relativePath,
    content: resource.content,
    ...(resource.origin ? { origin: resource.origin } : {}),
    ...(resource.executable !== undefined ? { executable: resource.executable } : {}),
  }));
}

function toResolveError(err: unknown): ResolveError {
  if (err instanceof ResolveError) return err;
  return new ResolveError(err instanceof Error ? err.message : String(err));
}
