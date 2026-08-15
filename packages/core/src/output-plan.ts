import type { StructuredMergePlan } from './structured-output.js';
import { ErrorCode, PSError } from './errors/base.js';

/**
 * Formatter output shape understood by the shared output planner.
 *
 * Formatter packages may add fields to this shape, but filesystem consumers
 * must only depend on these portable fields.
 */
export interface OutputArtifact {
  /** Relative output path. */
  path: string;
  /** File contents. */
  content: string;
  /** Optional Unix file mode. */
  mode?: number;
  /** Optional structured merge instructions. */
  merge?: StructuredMergePlan;
  /** Nested resources emitted with this artifact. */
  additionalFiles?: OutputArtifact[];
  /** Relative directories managed by this artifact. */
  managedOutputDirectories?: string[];
  /** Relative files managed by this artifact. */
  managedOutputFiles?: string[];
}

/** Role an artifact plays in collision resolution. */
export type OutputPlanArtifactRole = 'primary' | 'resource' | 'injected';

/**
 * A formatter artifact submitted to the planner.
 */
export interface OutputPlanCandidate {
  /** Artifact to flatten into the plan. */
  output: OutputArtifact;
  /** Formatter or adapter that owns the artifact. */
  owner: string;
  /** Collision precedence role. Defaults to primary. */
  role?: OutputPlanArtifactRole;
}

/**
 * One normalized file in an output plan.
 */
export interface OutputPlanFile extends Omit<OutputArtifact, 'additionalFiles'> {
  /** Normalized project-relative path. */
  path: string;
  /** Original formatter path before normalization. */
  originalPath: string;
  /** Formatter or adapter that owns the file. */
  owner: string;
  /** Artifact role used for collision resolution. */
  role: OutputPlanArtifactRole;
  /** Normalized parent path for nested resources. */
  resourceOf?: string;
}

/** Collision resolution selected by the planner. */
export type OutputPlanCollisionResolution =
  'preserve-existing' | 'replace-existing' | 'merge-identical';

/**
 * Collision observed while constructing an output plan.
 */
export interface OutputPlanCollision {
  /** Normalized colliding path. */
  path: string;
  /** Owner of the already selected artifact. */
  existingOwner: string;
  /** Owner of the incoming artifact. */
  incomingOwner: string;
  /** Role of the incoming artifact. */
  incomingRole: OutputPlanArtifactRole;
  /** Whether write semantics are identical. */
  identical: boolean;
  /** Deterministic resolution applied by the planner. */
  resolution: OutputPlanCollisionResolution;
}

/** Managed paths captured by an output plan. */
export interface OutputPlanManagedPaths {
  /** Normalized managed directories. */
  directories: string[];
  /** Normalized managed files. */
  files: string[];
}

/**
 * Shared, filesystem-independent output plan.
 *
 * `files` is sorted by normalized path. `outputs` and `owners` use the same
 * deterministic order. Collision resolution happens before any filesystem
 * consumer sees the plan.
 */
export interface OutputPlan {
  /** Selected normalized files. */
  files: OutputPlanFile[];
  /** Selected files indexed by normalized path. */
  outputs: Map<string, OutputPlanFile>;
  /** Selected owner indexed by normalized path. */
  owners: Map<string, string>;
  /** All collisions, in candidate traversal order. */
  collisions: OutputPlanCollision[];
  /** Managed paths declared by selected files. */
  managedPaths: OutputPlanManagedPaths;
  /** Selected nested resources. */
  resources: OutputPlanFile[];
  /** Selected auto-injected files. */
  injected: OutputPlanFile[];
  /** Convenience aliases for managed path consumers. */
  managedOutputDirectories: string[];
  managedOutputFiles: string[];
}

/**
 * Error raised when a formatter emits a path that cannot be represented as a
 * project-relative output.
 */
export class OutputPlanPathError extends PSError {
  /** Invalid formatter path. */
  readonly path: string;

  constructor(path: string) {
    super(`Output path must be project-relative and contained: ${path}`, ErrorCode.INVALID_PATH);
    this.name = 'OutputPlanPathError';
    this.path = path;
  }
}

/**
 * Normalize a project-relative output path.
 *
 * Leading `./` and redundant separators are harmless and removed. Absolute
 * paths and parent traversal are rejected instead of being silently repaired.
 */
export function normalizeOutputPath(path: string): string {
  if (typeof path !== 'string' || path.length === 0) {
    throw new OutputPlanPathError(path);
  }

  const normalized = path.replaceAll('\\', '/');
  if (normalized.startsWith('/') || normalized.startsWith('//') || /^[A-Za-z]:/.test(normalized)) {
    throw new OutputPlanPathError(path);
  }

  const segments: string[] = [];
  for (const segment of normalized.split('/')) {
    if (segment.length === 0 || segment === '.') continue;
    if (segment === '..') throw new OutputPlanPathError(path);
    segments.push(segment);
  }

  if (segments.length === 0) throw new OutputPlanPathError(path);
  return segments.join('/');
}

/**
 * Return the stable key used to detect files that cannot coexist on common
 * project filesystems.
 *
 * Collision keys use NFC normalization and locale-independent case folding
 * for every host. Keeping the plan conservative on case-sensitive hosts makes
 * Node and browser consumers produce the same plan before a filesystem exists.
 */
export function normalizeOutputCollisionKey(path: string): string {
  return normalizeOutputPath(path).normalize('NFC').toLocaleLowerCase('en-US');
}

function normalizeManagedPath(path: string): string | undefined {
  if (typeof path !== 'string' || path.length === 0) return undefined;
  const normalized = path.replaceAll('\\', '/');
  if (normalized.startsWith('/') || normalized.startsWith('//') || /^[A-Za-z]:/.test(normalized)) {
    throw new OutputPlanPathError(path);
  }

  const segments: string[] = [];
  for (const segment of normalized.split('/')) {
    if (segment.length === 0 || segment === '.') continue;
    if (segment === '..') throw new OutputPlanPathError(path);
    segments.push(segment);
  }
  return segments.join('/') || '.';
}

function normalizeManagedPaths(output: OutputArtifact): {
  directories?: string[];
  files?: string[];
} {
  const directories = [
    ...new Set(
      (output.managedOutputDirectories ?? [])
        .map(normalizeManagedPath)
        .filter((path): path is string => path !== undefined && path.length > 0)
    ),
  ];
  const files = [
    ...new Set(
      (output.managedOutputFiles ?? [])
        .map(normalizeManagedPath)
        .filter((path): path is string => path !== undefined && path.length > 0)
    ),
  ];

  return {
    ...(directories.length > 0 ? { directories } : {}),
    ...(files.length > 0 ? { files } : {}),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function valuesEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (typeof left !== typeof right || left === null || right === null) return false;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }
    return left.every((value, index) => valuesEqual(value, right[index]));
  }

  if (!isRecord(left) || !isRecord(right)) return false;
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (leftKeys.length !== rightKeys.length) return false;
  return leftKeys.every(
    (key, index) => key === rightKeys[index] && valuesEqual(left[key], right[key])
  );
}

function hasIdenticalWriteSemantics(existing: OutputPlanFile, candidate: OutputPlanFile): boolean {
  return (
    existing.content === candidate.content &&
    existing.mode === candidate.mode &&
    valuesEqual(existing.merge, candidate.merge)
  );
}

function mergeManagedMetadata(existing: OutputPlanFile, candidate: OutputPlanFile): OutputPlanFile {
  const directories = [
    ...new Set([
      ...(existing.managedOutputDirectories ?? []),
      ...(candidate.managedOutputDirectories ?? []),
    ]),
  ];
  const files = [
    ...new Set([...(existing.managedOutputFiles ?? []), ...(candidate.managedOutputFiles ?? [])]),
  ];

  return {
    ...existing,
    managedOutputDirectories: directories.length > 0 ? directories : undefined,
    managedOutputFiles: files.length > 0 ? files : undefined,
  };
}

function toPlanFile(
  output: OutputArtifact,
  owner: string,
  role: OutputPlanArtifactRole,
  resourceOf?: string
): OutputPlanFile {
  const path = normalizeOutputPath(output.path);
  const managed = normalizeManagedPaths(output);
  return {
    path,
    originalPath: output.path,
    content: output.content,
    ...(output.mode !== undefined ? { mode: output.mode } : {}),
    ...(output.merge !== undefined ? { merge: output.merge } : {}),
    ...(managed.directories !== undefined ? { managedOutputDirectories: managed.directories } : {}),
    ...(managed.files !== undefined ? { managedOutputFiles: managed.files } : {}),
    owner,
    role,
    ...(resourceOf !== undefined ? { resourceOf } : {}),
  };
}

function flattenCandidate(candidate: OutputPlanCandidate): OutputPlanFile[] {
  const role = candidate.role ?? 'primary';
  const files: OutputPlanFile[] = [];

  const visit = (
    output: OutputArtifact,
    currentRole: OutputPlanArtifactRole,
    resourceOf: string | undefined
  ): void => {
    const file = toPlanFile(output, candidate.owner, currentRole, resourceOf);
    files.push(file);
    for (const child of output.additionalFiles ?? []) {
      visit(child, 'resource', file.path);
    }
  };

  visit(candidate.output, role, undefined);
  return files;
}

function comparePaths(left: OutputPlanFile, right: OutputPlanFile): number {
  if (left.path < right.path) return -1;
  return Number(left.path > right.path);
}

/**
 * Build a deterministic output plan from formatter artifacts.
 *
 * Primary artifacts replace conflicting earlier artifacts, matching compiler
 * target precedence. Resources and injected artifacts preserve the first
 * owner so a nested resource cannot clobber an already selected file.
 */
export function createOutputPlan(candidates: readonly OutputPlanCandidate[]): OutputPlan {
  const selected = new Map<string, OutputPlanFile>();
  const collisions: OutputPlanCollision[] = [];

  for (const candidate of candidates) {
    for (const file of flattenCandidate(candidate)) {
      const collisionKey = normalizeOutputCollisionKey(file.path);
      const existing = selected.get(collisionKey);
      if (!existing) {
        selected.set(collisionKey, file);
        continue;
      }

      const identical = hasIdenticalWriteSemantics(existing, file);
      if (identical) {
        selected.set(collisionKey, mergeManagedMetadata(existing, file));
        collisions.push({
          path: file.path,
          existingOwner: existing.owner,
          incomingOwner: file.owner,
          incomingRole: file.role,
          identical: true,
          resolution: 'merge-identical',
        });
        continue;
      }

      const replace = file.role === 'primary';
      if (replace) {
        // Cleanup ownership survives replacement so stale files from the loser
        // remain eligible for managed cleanup.
        selected.set(collisionKey, mergeManagedMetadata(file, existing));
      }
      collisions.push({
        path: file.path,
        existingOwner: existing.owner,
        incomingOwner: file.owner,
        incomingRole: file.role,
        identical: false,
        resolution: replace ? 'replace-existing' : 'preserve-existing',
      });
    }
  }

  const files = [...selected.values()].sort(comparePaths);
  const outputs = new Map<string, OutputPlanFile>();
  const owners = new Map<string, string>();
  for (const file of files) {
    outputs.set(file.path, file);
    owners.set(file.path, file.owner);
  }

  const managedDirectories = new Set<string>();
  const managedFiles = new Set<string>();
  for (const file of files) {
    for (const directory of file.managedOutputDirectories ?? []) {
      managedDirectories.add(directory);
    }
    for (const managedFile of file.managedOutputFiles ?? []) {
      managedFiles.add(managedFile);
    }
  }

  const managedPaths = {
    directories: [...managedDirectories].sort(),
    files: [...managedFiles].sort(),
  };

  return {
    files,
    outputs,
    owners,
    collisions,
    managedPaths,
    resources: files.filter((file) => file.role === 'resource'),
    injected: files.filter((file) => file.role === 'injected'),
    managedOutputDirectories: managedPaths.directories,
    managedOutputFiles: managedPaths.files,
  };
}
