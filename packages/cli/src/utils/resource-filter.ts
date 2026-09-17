import {
  classifyOutputResource,
  isOutputResourceKind,
  type OutputPlan,
  type OutputResourceKind,
} from '@promptscript/core';
import type { FormatterOutput } from '@promptscript/compiler';

/**
 * Parse and validate a resource selection from CLI flags or config.
 *
 * Values may be comma-separated; order is preserved after deduplication.
 */
export function parseResourceSelection(values: readonly string[] | undefined): {
  kinds: OutputResourceKind[];
  invalid: string[];
} {
  if (!values || values.length === 0) return { kinds: [], invalid: [] };

  const kinds: OutputResourceKind[] = [];
  const invalid: string[] = [];
  for (const raw of values.flatMap((value) => value.split(','))) {
    const item = raw.trim();
    if (!item) continue;
    if (isOutputResourceKind(item)) {
      if (!kinds.includes(item)) kinds.push(item);
    } else if (!invalid.includes(item)) {
      invalid.push(item);
    }
  }
  return { kinds, invalid };
}

export interface ResourceFilteredOutputs {
  /** Outputs whose resource kind is selected. */
  readonly outputs: Map<string, FormatterOutput>;
  /** How many planned files the selection kept. */
  readonly kept: number;
  /** How many planned files the selection dropped. */
  readonly dropped: number;
}

/**
 * Keep only plan files whose catalog resource kind is selected.
 *
 * Unmatched paths classify as `main`, so a selection without `main` also
 * drops root instruction files, rule files, and workflows.
 */
export function filterOutputsByResources(
  plan: OutputPlan,
  outputs: Map<string, FormatterOutput>,
  kinds: ReadonlySet<OutputResourceKind>
): ResourceFilteredOutputs {
  const filtered = new Map<string, FormatterOutput>();

  for (const file of plan.files) {
    if (!kinds.has(classifyOutputResource(file.owner, file.path))) continue;
    const existing = outputs.get(file.path);
    filtered.set(
      file.path,
      existing ?? {
        path: file.path,
        content: file.content,
        ...(file.mode !== undefined ? { mode: file.mode } : {}),
        ...(file.merge !== undefined ? { merge: file.merge } : {}),
        ...(file.managedOutputDirectories !== undefined
          ? { managedOutputDirectories: file.managedOutputDirectories }
          : {}),
        ...(file.managedOutputFiles !== undefined
          ? { managedOutputFiles: file.managedOutputFiles }
          : {}),
      }
    );
  }

  return {
    outputs: filtered,
    kept: filtered.size,
    dropped: plan.files.length - filtered.size,
  };
}
