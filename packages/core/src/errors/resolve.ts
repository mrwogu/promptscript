import type { SourceLocation } from '../types/source.js';
import { PSError, ErrorCode } from './base.js';
import type { AgentConflict } from '../agent-names.js';
import type { AgentProvenance } from '../types/ast.js';

/**
 * Error during resolution phase.
 */
export class ResolveError extends PSError {
  constructor(
    message: string,
    location?: SourceLocation,
    code: ErrorCode = ErrorCode.RESOLVE_ERROR
  ) {
    super(message, code, { location });
    this.name = 'ResolveError';
  }
}

/**
 * File not found during resolution.
 */
export class FileNotFoundError extends ResolveError {
  /** Path that was not found */
  readonly path: string;

  constructor(path: string, location?: SourceLocation) {
    super(`File not found: ${path}`, location, ErrorCode.FILE_NOT_FOUND);
    this.name = 'FileNotFoundError';
    this.path = path;
  }
}

/**
 * Circular dependency detected.
 */
export class CircularDependencyError extends ResolveError {
  /** Chain of files forming the cycle */
  readonly chain: string[];

  constructor(chain: string[]) {
    super(
      `Circular dependency detected: ${chain.join(' → ')}`,
      undefined,
      ErrorCode.CIRCULAR_DEPENDENCY
    );
    this.name = 'CircularDependencyError';
    this.chain = chain;
  }
}

/**
 * Circular dependency detected in guard requires chain.
 */
export class CircularGuardRequiresError extends ResolveError {
  readonly chain: string[];
  constructor(chain: string[], location?: SourceLocation) {
    super(
      `Circular guard dependency detected: ${chain.join(' → ')}`,
      location,
      ErrorCode.CIRCULAR_GUARD_REQUIRES
    );
    this.name = 'CircularGuardRequiresError';
    this.chain = chain;
  }
}

/**
 * Conflicting agent definitions detected during composition.
 */
export class AgentConflictError extends ResolveError {
  /** First conflicting agent name */
  readonly agentName: string;
  /** Provenance for the first conflicting name */
  readonly provenance: AgentProvenance[];
  /** All conflicting names and their provenance */
  readonly conflicts: AgentConflict[];

  constructor(conflicts: AgentConflict[], location?: SourceLocation) {
    const names = conflicts.map((conflict) => conflict.name);
    const details = conflicts
      .map((conflict) => {
        const sources = conflict.provenance.map((entry) => {
          const importLabel = entry.importPath ? ` via @use ${entry.importPath}` : '';
          const namespaceLabel = entry.namespace ? ` (namespace: ${entry.namespace})` : '';
          return `${entry.source}${importLabel}${namespaceLabel}`;
        });
        return `  ${conflict.name}: ${sources.join('; ')}`;
      })
      .join('\n');
    super(
      `Conflicting agent name(s): ${names.join(', ')}.\n${details}\n` +
        'Use a unique @use alias or rename the agent definitions to resolve the conflict.',
      location,
      ErrorCode.AGENT_NAME_CONFLICT
    );
    this.name = 'AgentConflictError';
    this.conflicts = conflicts;
    this.agentName = conflicts[0]?.name ?? '';
    this.provenance = conflicts[0]?.provenance ?? [];
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      agentName: this.agentName,
      provenance: this.provenance,
      conflicts: this.conflicts,
    };
  }
}

/**
 * Git clone operation failed.
 */
export class GitCloneError extends ResolveError {
  /** Git repository URL */
  readonly url: string;

  constructor(message: string, url: string, location?: SourceLocation, cause?: Error) {
    super(message, location, ErrorCode.GIT_CLONE_ERROR);
    this.name = 'GitCloneError';
    this.url = url;
    if (cause) {
      (this as { cause?: Error }).cause = cause;
    }
  }
}

/**
 * Git authentication failed.
 */
export class GitAuthError extends ResolveError {
  /** Git repository URL */
  readonly url: string;

  constructor(message: string, url: string, location?: SourceLocation) {
    super(message, location, ErrorCode.GIT_AUTH_ERROR);
    this.name = 'GitAuthError';
    this.url = url;
  }
}

/**
 * Git ref (branch/tag/commit) not found.
 */
export class GitRefNotFoundError extends ResolveError {
  /** Git ref that was not found */
  readonly ref: string;
  /** Git repository URL */
  readonly url: string;

  constructor(ref: string, url: string, location?: SourceLocation) {
    super(`Git ref not found: ${ref} in ${url}`, location, ErrorCode.GIT_REF_NOT_FOUND);
    this.name = 'GitRefNotFoundError';
    this.ref = ref;
    this.url = url;
  }
}
