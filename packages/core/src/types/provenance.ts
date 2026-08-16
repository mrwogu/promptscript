import type { SourceLocation } from './source.js';

/**
 * Composition operation that contributed to a resolved value.
 */
export type ProvenanceOperation =
  'declaration' | 'inherit' | 'use' | 'extend' | 'override' | 'compose' | 'generated';

/**
 * Result of a composition operation for a resolved value.
 */
export type ProvenanceAction =
  'declared' | 'selected' | 'merged' | 'appended' | 'replaced' | 'removed' | 'composed';

/**
 * Link in the source chain that led to a resolved value.
 */
export interface ProvenanceLink {
  readonly operation: Exclude<ProvenanceOperation, 'declaration' | 'generated'>;
  readonly source: SourceLocation;
  readonly target?: string;
  readonly reference?: string;
  readonly alias?: string;
}

/**
 * One operation recorded for a resolved value.
 */
export interface ProvenanceStep {
  readonly operation: ProvenanceOperation;
  readonly action: ProvenanceAction;
  readonly source: SourceLocation;
  readonly strategy?: string;
  readonly target?: string;
  readonly reference?: string;
  readonly alias?: string;
  readonly chain: readonly ProvenanceLink[];
  /** Transitive trace carried by a composition step. */
  readonly trace?: ProvenanceTrace;
}

/**
 * Provenance for one final block or nested value path.
 */
export interface ProvenanceEntry {
  /**
   * Canonical path. Blocks use `block`, fields use `block.field`, and list
   * entries use `block[0]` or `block.field[0]`.
   */
  readonly path: string;
  /** Kind of final value represented by the path. */
  readonly kind: 'block' | 'field' | 'value' | 'list' | 'text' | 'inline-use';
  /** Source location of the final value declaration. */
  readonly source: SourceLocation;
  /** Ordered declaration and composition history for the final value. */
  readonly history: readonly ProvenanceStep[];
}

/**
 * Public provenance model returned with a resolved program.
 */
export interface ProvenanceTrace {
  readonly version: 1;
  /** Entry file used to produce the resolved program. */
  readonly entry: string;
  /** Stable, path-ordered provenance entries. */
  readonly entries: readonly ProvenanceEntry[];
}

/**
 * Resolver-provided operation appended to a provenance entry.
 */
export interface ProvenanceEvent {
  readonly path: string;
  readonly kind?: ProvenanceEntry['kind'];
  readonly operation: ProvenanceOperation;
  readonly action: ProvenanceAction;
  readonly source: SourceLocation;
  readonly strategy?: string;
  readonly target?: string;
  readonly reference?: string;
  readonly alias?: string;
  /** Transitive trace carried by a composition event. */
  readonly trace?: ProvenanceTrace;
  readonly chain?: readonly ProvenanceLink[];
}
