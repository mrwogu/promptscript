/**
 * Output resource classification for resource selection.
 *
 * Maps a planned output path to the catalog resource kind it belongs to, so
 * `prs compile --resources` can emit only selected resources (for example
 * agent and skill directories) without unrelated root instruction files.
 */

import { TARGET_CAPABILITIES } from './target-catalog.js';
import { isKnownTarget } from './types/config.js';

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
 * Classify a planned output path by the target's catalog resources.
 *
 * Unknown owners and paths no resource covers classify as `main`, so a
 * resource-only run never keeps files the selection did not name.
 */
export function classifyOutputResource(target: string, path: string): OutputResourceKind {
  if (!isKnownTarget(target)) return 'main';

  const normalizedPath = path.replaceAll('\\', '/');
  let best: ResourceMatch | undefined;

  for (const resource of TARGET_CAPABILITIES[target].resources) {
    if (resource.kind === 'main') {
      if (resource.path === normalizedPath) {
        best = keepBestMatch(best, { kind: 'main', specificity: resource.path.length + 2 });
      }
      continue;
    }

    const specificity = matchResourcePath(resource.path, normalizedPath);
    if (specificity > 0) {
      best = keepBestMatch(best, { kind: resource.kind, specificity });
      continue;
    }

    // Hook configs that live in a dedicated '<dir>/hooks' directory manage
    // sibling files in that directory (for example GitHub's vscode hook
    // config next to promptscript.json).
    if (resource.kind === 'hooks') {
      const directory = resource.path.slice(0, resource.path.lastIndexOf('/'));
      if (
        directory.endsWith('/hooks') &&
        normalizedPath.startsWith(`${directory}/`) &&
        !normalizedPath.slice(directory.length + 1).includes('/')
      ) {
        best = keepBestMatch(best, { kind: 'hooks', specificity: directory.length + 2 });
      }
    }
  }

  return best?.kind ?? 'main';
}
