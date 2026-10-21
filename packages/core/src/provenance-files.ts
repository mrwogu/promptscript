import type {
  ProvenanceEntry,
  ProvenanceLink,
  ProvenanceStep,
  ProvenanceTrace,
  SourceLocation,
} from './types/index.js';

/** Options of {@link normalizeProvenanceFiles}. */
export interface NormalizeProvenanceOptions {
  /**
   * Resolves symbolic links of an absolute path. Left out where there is no file system
   * (the browser compiler). A throwing resolver leaves the path as it is.
   */
  realpath?: (path: string) => string;
}

const DRIVE_LETTER = /^[A-Za-z]:/;
const LOCAL_REFERENCE = /^(?:\.{1,2}(?:[\\/]|$)|[\\/]|[A-Za-z]:)/;

function toPosix(path: string): string {
  return path.normalize('NFC').replace(/\\/g, '/');
}

function isAbsoluteLike(path: string): boolean {
  return path.startsWith('/') || DRIVE_LETTER.test(path);
}

/** Collapse `.` and `..` segments and repeated separators. Keeps leading `..` of a relative path. */
function collapse(posixPath: string): string {
  const absolute = posixPath.startsWith('/');
  const drive = DRIVE_LETTER.exec(posixPath)?.[0] ?? '';
  const rest = drive ? posixPath.slice(drive.length) : posixPath;
  const out: string[] = [];
  for (const segment of rest.split('/')) {
    if (segment === '' || segment === '.') continue;
    if (segment === '..') {
      if (out.length > 0 && out[out.length - 1] !== '..') out.pop();
      else if (!absolute && !drive) out.push('..');
      continue;
    }
    out.push(segment);
  }
  const prefix = drive ? `${drive}${rest.startsWith('/') ? '/' : ''}` : absolute ? '/' : '';
  return prefix + out.join('/');
}

function basename(posixPath: string): string {
  const segments = posixPath.split('/').filter((segment) => segment.length > 0);
  return segments[segments.length - 1] ?? 'unknown';
}

function external(posixPath: string): string {
  return `external:${basename(posixPath)}`;
}

/** Whether a normalized path may appear in an artifact. */
function isSafeRelative(path: string): boolean {
  return (
    path.length > 0 &&
    !isAbsoluteLike(path) &&
    path !== '..' &&
    !path.startsWith('../') &&
    !path.includes(':')
  );
}

class FileNormalizer {
  private readonly root: string | undefined;
  private readonly references = new Map<string, string>();

  constructor(
    projectRoot: string | undefined,
    private readonly realpath: ((path: string) => string) | undefined
  ) {
    this.root =
      projectRoot === undefined ? undefined : this.stripTrailingSlash(this.resolve(projectRoot));
  }

  /** Remember the authored reference of every file an import resolved to. */
  learn(target: string | undefined, reference: string | undefined): void {
    if (target === undefined || reference === undefined) return;
    if (!isAbsoluteLike(toPosix(target)) || LOCAL_REFERENCE.test(reference)) return;
    this.references.set(collapse(toPosix(target)), reference);
  }

  file(raw: string): string {
    if (raw.startsWith('external:')) return raw;
    const posix = collapse(toPosix(raw));
    const reference = this.references.get(posix);
    if (reference !== undefined) return reference;
    const relative = this.relativeToRoot(this.resolve(raw));
    return relative !== undefined && isSafeRelative(relative) ? relative : external(posix);
  }

  private resolve(raw: string): string {
    const posix = collapse(toPosix(raw));
    if (!this.realpath || !isAbsoluteLike(posix)) return posix;
    try {
      return collapse(toPosix(this.realpath(raw)));
    } catch {
      return posix;
    }
  }

  private stripTrailingSlash(path: string): string {
    return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
  }

  private relativeToRoot(posix: string): string | undefined {
    if (!isAbsoluteLike(posix)) return posix;
    if (this.root === undefined || !isAbsoluteLike(this.root)) return undefined;
    const windows = DRIVE_LETTER.test(this.root);
    const left = windows ? posix.toLowerCase() : posix;
    const right = windows ? this.root.toLowerCase() : this.root;
    const prefix = right.endsWith('/') ? right : `${right}/`;
    return left.startsWith(prefix) ? posix.slice(prefix.length) : undefined;
  }
}

function learnTrace(normalizer: FileNormalizer, trace: ProvenanceTrace): void {
  const learnLink = (link: ProvenanceLink | ProvenanceStep): void =>
    normalizer.learn(link.target, link.reference);
  for (const entry of trace.entries) {
    for (const step of entry.history) {
      learnLink(step);
      step.chain.forEach(learnLink);
      if (step.trace) learnTrace(normalizer, step.trace);
    }
  }
}

function location(normalizer: FileNormalizer, source: SourceLocation): SourceLocation {
  return { ...source, file: normalizer.file(source.file) };
}

function target(normalizer: FileNormalizer, value: string | undefined): string | undefined {
  return value !== undefined && isAbsoluteLike(toPosix(value)) ? normalizer.file(value) : value;
}

function link(normalizer: FileNormalizer, source: ProvenanceLink): ProvenanceLink {
  const { target: linkTarget, ...rest } = source;
  const mapped = target(normalizer, linkTarget);
  return {
    ...rest,
    source: location(normalizer, source.source),
    ...(mapped !== undefined ? { target: mapped } : {}),
  };
}

function step(normalizer: FileNormalizer, source: ProvenanceStep): ProvenanceStep {
  const { target: stepTarget, trace, ...rest } = source;
  const mapped = target(normalizer, stepTarget);
  return {
    ...rest,
    source: location(normalizer, source.source),
    chain: source.chain.map((item) => link(normalizer, item)),
    ...(mapped !== undefined ? { target: mapped } : {}),
    ...(trace ? { trace: traceOf(normalizer, trace) } : {}),
  };
}

function entry(normalizer: FileNormalizer, source: ProvenanceEntry): ProvenanceEntry {
  return {
    ...source,
    source: location(normalizer, source.source),
    history: source.history.map((item) => step(normalizer, item)),
  };
}

function traceOf(normalizer: FileNormalizer, source: ProvenanceTrace): ProvenanceTrace {
  return {
    ...source,
    entry: normalizer.file(source.entry),
    entries: source.entries.map((item) => entry(normalizer, item)),
  };
}

/**
 * Rewrite every file in a provenance trace so no machine path survives.
 *
 * Covers `entry`, every `source` (entries, history steps, chain links, nested traces) and
 * absolute `target` values. A file is named by how it was resolved:
 * - a file reached through a registry or pack reference becomes the authored reference,
 *   whether it sits in a git cache or a vendored directory;
 * - a file under `projectRoot` becomes a relative POSIX path (symbolic links resolved,
 *   Unicode NFC);
 * - anything else, or anything that would still be absolute, climb above the root or carry a
 *   drive letter, becomes `external:<basename>`.
 *
 * The function is pure. It never reads the file system except through the optional `realpath`.
 *
 * @param trace - Trace from a resolver
 * @param projectRoot - Project root the in-root paths are relative to
 * @param options - Optional symbolic link resolver
 * @returns A new trace. The input is not changed.
 *
 * @example
 * const safe = normalizeProvenanceFiles(program.provenance, '/work/app');
 */
export function normalizeProvenanceFiles(
  trace: ProvenanceTrace,
  projectRoot: string | undefined,
  options: NormalizeProvenanceOptions = {}
): ProvenanceTrace {
  const normalizer = new FileNormalizer(projectRoot, options.realpath);
  learnTrace(normalizer, trace);
  return traceOf(normalizer, trace);
}
