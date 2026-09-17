/**
 * Output resource classification for resource selection.
 *
 * Maps a planned output path to the catalog resource kind it belongs to, so
 * `prs compile --resources` can emit only selected resources (for example
 * agent and skill directories) without unrelated root instruction files.
 */

import { TARGET_CAPABILITIES } from './target-catalog.js';
import { type TargetResourceCapability } from './target-capabilities.js';
import { isKnownTarget, type KnownTarget } from './types/config.js';

/**
 * Resource kinds a compile run can select.
 *
 * `main` is the target's instruction surface (root instruction files, rules,
 * workflows, local memory); everything else matches the catalog resource
 * categories.
 */
export type OutputResourceKind =
  'main' | 'skills' | 'agents' | 'commands' | 'hooks' | 'mcp' | 'plugins';

/**
 * Selectable resource kinds, in stable order.
 */
export const OUTPUT_RESOURCE_KINDS: readonly OutputResourceKind[] = [
  'agents',
  'skills',
  'commands',
  'mcp',
  'hooks',
  'plugins',
  'main',
];

export function isOutputResourceKind(value: string): value is OutputResourceKind {
  return (OUTPUT_RESOURCE_KINDS as readonly string[]).includes(value);
}

interface ResourceMatch {
  readonly kind: OutputResourceKind;
  /** Longer matches win so nested paths resolve to the most specific kind. */
  readonly specificity: number;
}

function keepBestMatch(current: ResourceMatch | undefined, next: ResourceMatch): ResourceMatch {
  return current && current.specificity >= next.specificity ? current : next;
}

function matchResourcePath(resourcePath: string, normalizedPath: string): number {
  const nameIndex = resourcePath.indexOf('<name>');
  if (nameIndex >= 0) {
    // '.claude/agents/<name>.md' classifies everything under '.claude/agents/'.
    const prefix = resourcePath.slice(0, nameIndex);
    return normalizedPath.startsWith(prefix) ? prefix.length : 0;
  }
  return resourcePath === normalizedPath ? resourcePath.length + 2 : 0;
}

/**
 * Normalize a configured base directory for prefix comparison.
 */
function normalizeBaseDir(dir: string): string {
  return dir.replaceAll('\\', '/').split('/').filter(Boolean).join('/');
}

/**
 * Specificity of a hooks-config sibling file in the same '<dir>/hooks'
 * directory (for example GitHub's vscode hook config next to
 * promptscript.json), or 0 when the path is not a sibling.
 */
function hooksSiblingSpecificity(
  resource: TargetResourceCapability,
  normalizedPath: string
): number {
  const directory = resource.path.slice(0, resource.path.lastIndexOf('/'));
  if (!directory.endsWith('/hooks')) return 0;
  if (!normalizedPath.startsWith(`${directory}/`)) return 0;
  if (normalizedPath.slice(directory.length + 1).includes('/')) return 0;
  return directory.length + 2;
}

/**
 * Most specific catalog resource kind covering the path, or undefined.
 */
function matchCatalogResource(
  target: KnownTarget,
  normalizedPath: string
): OutputResourceKind | undefined {
  let best: ResourceMatch | undefined;

  for (const resource of TARGET_CAPABILITIES[target].resources) {
    let next: ResourceMatch | undefined;
    if (resource.kind === 'main') {
      // Same matcher as every other kind: a '<name>' placeholder in a main
      // path must still claim its files before the skillBaseDir fallback.
      const specificity = matchResourcePath(resource.path, normalizedPath);
      if (specificity > 0) {
        next = { kind: 'main', specificity };
      }
    } else {
      const specificity =
        matchResourcePath(resource.path, normalizedPath) ||
        (resource.kind === 'hooks' ? hooksSiblingSpecificity(resource, normalizedPath) : 0);
      if (specificity > 0) {
        next = { kind: resource.kind, specificity };
      }
    }
    if (next) {
      best = keepBestMatch(best, next);
    }
  }

  return best?.kind;
}

/**
 * Classify a planned output path by the target's catalog resources.
 *
 * Unknown owners and paths no resource covers classify as `main`, so a
 * resource-only run never keeps files the selection did not name. A
 * configured `skillBaseDir` relocates skill outputs off the catalog default
 * path, so it classifies unmatched paths under it as `skills`.
 */
export function classifyOutputResource(
  target: string,
  path: string,
  skillBaseDir?: string
): OutputResourceKind {
  const normalizedPath = path.replaceAll('\\', '/');
  const catalogKind = isKnownTarget(target)
    ? matchCatalogResource(target, normalizedPath)
    : undefined;
  if (catalogKind) return catalogKind;

  const baseDir = skillBaseDir ? normalizeBaseDir(skillBaseDir) : '';
  if (baseDir && (normalizedPath === baseDir || normalizedPath.startsWith(`${baseDir}/`))) {
    return 'skills';
  }
  return 'main';
}
