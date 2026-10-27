import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute, join, normalize, relative, sep } from 'node:path';
import { compareCodeUnits } from '@promptscript/core';
import { GovernanceError, PS5108_GIT_UNAVAILABLE } from '../../utils/governance-error.js';
import { runGit, stripControlCharacters } from '../release/git.js';

/** One generated line: a root-relative path and its owners. */
export interface OwnerLine {
  path: string;
  owners: string[];
  /** The path is a directory, or may be one */
  directory?: boolean;
}

/** The paths and Git facts every line is checked against. */
export interface Repository {
  /** Real path of the Git top level */
  top: string;
  /** The project root as given, and its real path */
  root: string;
  rootReal: string;
  /** The project directory relative to the top level, `''` at the root */
  project: string;
  /** Every path Git tracks or would track, from `git ls-files -co --exclude-standard` */
  tracked: ReadonlySet<string>;
  /** Those paths by their lowercase form, to name a path that differs only in case */
  folded: ReadonlyMap<string, string>;
}

/** What building the lines found besides the lines. */
export interface Findings {
  /** Reasons to write nothing (PS5107) */
  refused: string[];
  /** Repository paths a line needs but Git does not track, so CODEOWNERS cannot own them */
  unowned: string[];
  warn: (message: string) => void;
}

/** What a path check found: fine, refused with a reason, or not tracked by Git. */
type PathVerdict = { ok: true } | { ok: false; refused?: string; untracked?: boolean };

const MAX_GIT_PATHS_BYTES = 64 * 1024 * 1024;

export function toPosix(path: string): string {
  return path.split(sep).join('/');
}

export function sortedUnique(values: Iterable<string>): string[] {
  return [...new Set(values)].sort(compareCodeUnits);
}

function gitFailure(error: unknown): GovernanceError {
  return new GovernanceError(
    PS5108_GIT_UNAVAILABLE,
    error instanceof Error ? error.message : String(error)
  );
}

async function gitTopLevel(root: string): Promise<string> {
  const result = await runGit(['rev-parse', '--show-toplevel'], root).catch((error: unknown) => {
    throw gitFailure(error);
  });
  if (result.status !== 0 || result.stdout.trim() === '') {
    throw new GovernanceError(
      PS5108_GIT_UNAVAILABLE,
      `${root} is not in a Git repository, so there is no CODEOWNERS file to manage. Run the command in a Git checkout.`
    );
  }
  return realpath(result.stdout.trim());
}

/** The top level, the project inside it, and the paths Git has, read once. */
export async function readRepository(root: string): Promise<Repository> {
  const top = await gitTopLevel(root);
  const rootReal = await realpath(root);
  const listed = await runGit(['ls-files', '-z', '-co', '--exclude-standard'], top, {
    maxBuffer: MAX_GIT_PATHS_BYTES,
  }).catch((error: unknown) => {
    throw gitFailure(error);
  });
  if (listed.status !== 0) {
    throw new GovernanceError(
      PS5108_GIT_UNAVAILABLE,
      `git ls-files failed: ${stripControlCharacters(listed.stderr.trim())}. Run the command in a working Git checkout.`
    );
  }
  const paths = listed.stdout.split('\0').filter((path) => path !== '');
  return {
    top,
    root,
    rootReal,
    project: toPosix(relative(top, rootReal)),
    tracked: new Set(paths),
    folded: new Map(paths.map((path) => [path.toLowerCase(), path])),
  };
}

function isWithin(root: string, path: string): boolean {
  return path === root || path.startsWith(`${root}${sep}`);
}

/**
 * The repository-relative path of a file the loader or the resolver named, built from
 * the path as given, not its real path, so a link on the way stays visible. Undefined
 * outside the repository, like the registry cache.
 */
export function repoPath(file: string, repo: Repository): string | undefined {
  const fromProject = isWithin(repo.rootReal, file)
    ? relative(repo.rootReal, file)
    : relative(repo.root, file);
  const path = toPosix(normalize(join(repo.project, fromProject)));
  return path === '..' || path.startsWith('../') || isAbsolute(path) ? undefined : path;
}

/** The first component of `path` under the top level that is a symbolic link. */
export async function linkOnPath(top: string, path: string): Promise<string | undefined> {
  const parts = path.split('/');
  const prefixes = parts.map((_, index) => parts.slice(0, index + 1).join('/'));
  const links = await Promise.all(
    prefixes.map((prefix) =>
      lstat(join(top, prefix)).then(
        (stat) => stat.isSymbolicLink(),
        () => false
      )
    )
  );
  return prefixes.find((_, index) => links[index]);
}

function linkRefusal(path: string, link: string): string {
  return `${path} goes through the symbolic link ${link}, and CODEOWNERS matches the path, not the target. Replace the link with the file or directory.`;
}

/**
 * CODEOWNERS matches the path Git has, byte for byte, never what a link points to. A path
 * through a link or with another case than in Git is refused; one Git does not track at
 * all cannot get an owner.
 */
async function checkPath(path: string, repo: Repository): Promise<PathVerdict> {
  const link = await linkOnPath(repo.top, path);
  if (link !== undefined) return { ok: false, refused: linkRefusal(path, link) };
  if (repo.tracked.has(path)) return { ok: true };
  const other = repo.folded.get(path.toLowerCase());
  if (other !== undefined) {
    return {
      ok: false,
      refused: `${path} is ${other} in Git, and CODEOWNERS matches the path Git has byte for byte. Use the same case in the file name and in the path that names it.`,
    };
  }
  return { ok: false, untracked: true };
}

/**
 * Check file paths in parallel and report in order: kept paths come back, refusals and
 * paths Git does not track go to `findings`.
 */
export async function keepPaths(
  paths: string[],
  repo: Repository,
  findings: Findings
): Promise<string[]> {
  const verdicts = await Promise.all(paths.map((path) => checkPath(path, repo)));
  return paths.filter((path, index) => {
    const verdict = verdicts[index] ?? { ok: false };
    if (verdict.ok) return true;
    if (verdict.refused !== undefined) findings.refused.push(verdict.refused);
    if (verdict.untracked === true) {
      findings.unowned.push(path);
      findings.warn(
        `Git does not track ${path}, so CODEOWNERS cannot own it. Track the file, or put its directory and the files that install it, like package.json and the lockfile, in governance.codeowners.protect.`
      );
    }
    return false;
  });
}

/** Refuse fixed paths, like the approvals or the vendor directory, that go through a link. */
export async function refuseLinks(
  paths: string[],
  repo: Repository,
  findings: Findings
): Promise<void> {
  const links = await Promise.all(paths.map((path) => linkOnPath(repo.top, path)));
  paths.forEach((path, index) => {
    const link = links[index];
    if (link !== undefined) findings.refused.push(linkRefusal(path, link));
  });
}
