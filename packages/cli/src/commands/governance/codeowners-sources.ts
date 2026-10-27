import { existsSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import {
  effectiveGovernance,
  ErrorCode,
  extractPromptDefinitions,
  PSError,
  readMetaGovernance,
  type CanonicalProgram,
  type PromptScriptConfig,
  type ProvenanceTrace,
  type Value,
} from '@promptscript/core';
import { Resolver } from '@promptscript/resolver';
import { isGitHostIdentity } from '@promptscript/validator';
import {
  loadProjectLockfile,
  registryReferenceRoots,
  resolveProjectPath,
  resolveUniversalDir,
} from '../../utils/project-config.js';
import { resolveRegistryPath } from '../../utils/registry-resolver.js';
import {
  keepPaths,
  repoPath,
  sortedUnique,
  type Findings,
  type OwnerLine,
  type Repository,
} from './codeowners-paths.js';

interface ResolvedProject {
  program: CanonicalProgram;
  provenance: ProvenanceTrace;
  /** Every file the resolver read, as absolute paths */
  sources: string[];
  /** The entry file */
  entry: string;
}

/** One prompt of the project with what decides who may change it. */
interface GovernedPrompt {
  id: string;
  /** Effective owner and reviewers, sorted; empty when the prompt has none */
  owners: string[];
  /** Repository path of the file that defines the entry */
  file?: string;
  /** Repository paths of every file that adds to its content or its governance */
  contributors: Set<string>;
}

/** Resolve the project without network access, keeping the provenance of every value. */
async function resolveProject(
  repo: Repository,
  config: PromptScriptConfig,
  configPath: string
): Promise<ResolvedProject> {
  const { root } = repo;
  const entry = resolve(root, config.input?.entry ?? './.promptscript/project.prs');
  if (!existsSync(entry)) {
    throw new PSError(
      `Entry file not found: ${entry}. Set input.entry in ${configPath} or run prs init.`,
      ErrorCode.FILE_NOT_FOUND,
      { location: { file: configPath, line: 1, column: 1 } }
    );
  }
  const lockfile = await loadProjectLockfile(root);
  const vendorDir = resolve(root, '.promptscript/vendor');
  const registry = await resolveRegistryPath(config, { vendorDir, lockfile, readOnly: true });
  const resolver = new Resolver({
    registryPath: resolveProjectPath(root, registry.path),
    localPath: resolve(root, '.promptscript'),
    projectRoot: root,
    vendorDir,
    readOnly: true,
    referenceRoots: registryReferenceRoots(registry),
    lockfile,
    registries: config.registries,
    skills: resolveUniversalDir(config.universalDir),
  });
  const resolved = await resolver.resolve(entry);
  if (resolved.errors.length > 0 || !resolved.canonicalAst) {
    const details = resolved.errors.map((error) => error.message).join('; ');
    throw new PSError(
      `The project does not resolve, so its prompt owners are unknown: ${details}. Run prs validate.`,
      ErrorCode.RESOLVE_ERROR,
      { location: resolved.errors[0]?.location ?? { file: entry, line: 1, column: 1 } }
    );
  }
  return {
    program: resolved.canonicalAst,
    provenance: resolved.provenance,
    sources: resolved.sources,
    entry,
  };
}

/** A file on disk, not a registry marker or a path a directory import only tried. */
function isFile(path: string): boolean {
  return isAbsolute(path) && existsSync(path);
}

function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`);
}

/** Every file in the provenance of a value path or its children. */
function filesUnder(trace: ProvenanceTrace, prefix: string): string[] {
  return trace.entries
    .filter((entry) => isUnder(entry.path, prefix))
    .flatMap((entry) => [entry.source.file, ...entry.history.map((step) => step.source.file)]);
}

/**
 * The files whose `@meta` reaches every prompt: the entry and its `@inherit` chain.
 * `@use` carries no `@meta`, so only chains of inherit links count.
 */
function metaFiles(trace: ProvenanceTrace, entry: string): string[] {
  const files = [entry];
  for (const step of trace.entries.flatMap((value) => value.history)) {
    if (step.chain.length > 0 && step.chain.every((link) => link.operation === 'inherit')) {
      files.push(...step.chain.flatMap((link) => (link.target === undefined ? [] : [link.target])));
    }
  }
  return files;
}

/**
 * Every prompt with its effective owners and the files it is built from: its entry, the
 * blocks it composes, and the `@meta` of the entry file and its `@inherit` parents.
 */
function governedPrompts(project: ResolvedProject, repo: Repository): GovernedPrompt[] {
  const { program, provenance } = project;
  // The canonical meta is deeply readonly; readMetaGovernance only reads it.
  const fields = (program.meta?.fields ?? {}) as Record<string, Value>;
  const defaults = readMetaGovernance(fields);
  const metaId = fields['id'];
  const shared = metaFiles(provenance, project.entry);
  return extractPromptDefinitions(program).prompts.map((prompt) => {
    const { owner, reviewers } = effectiveGovernance(prompt.governance, defaults);
    const files = [
      ...shared,
      ...[`prompts.${prompt.name}`, ...prompt.compose].flatMap((path) =>
        filesUnder(provenance, path)
      ),
    ];
    return {
      id: typeof metaId === 'string' && metaId !== '' ? `${metaId}/${prompt.name}` : prompt.name,
      owners: sortedUnique([...(owner === undefined ? [] : [owner]), ...(reviewers ?? [])]),
      file: repoPath(prompt.loc.file, repo),
      contributors: new Set(
        files.filter(isFile).flatMap((file) => {
          const path = repoPath(file, repo);
          return path === undefined ? [] : [path];
        })
      ),
    };
  });
}

/** Owners of each prompt file: the union of its prompts' owners, else the admins. */
function fileOwners(
  prompts: GovernedPrompt[],
  admins: string[],
  findings: Findings
): Map<string, string[]> {
  const owners = new Map<string, string[]>();
  for (const prompt of prompts) {
    if (prompt.file === undefined) continue;
    for (const owner of prompt.owners.filter((value) => !isGitHostIdentity(value))) {
      findings.refused.push(
        `Prompt "${prompt.id}" has the owner or reviewer ${JSON.stringify(owner)}, which is not a Git host identity.`
      );
    }
    if (prompt.owners.length === 0) {
      findings.warn(
        `Prompt "${prompt.id}" has no owner or reviewers, so the admins review /${prompt.file}. Add owner or reviewers to the entry or to @meta.`
      );
    }
    owners.set(prompt.file, [...(owners.get(prompt.file) ?? []), ...prompt.owners]);
  }
  return new Map(
    [...owners].map(([file, list]) => [file, list.length > 0 ? sortedUnique(list) : admins])
  );
}

/**
 * A prompt file whose line owners differ from the owners of a prompt it feeds goes to the
 * admins: any one owner on a line can approve, so adding the admins next to the owners
 * would not protect the other prompt.
 */
function demote(
  owners: Map<string, string[]>,
  prompts: GovernedPrompt[],
  admins: string[],
  findings: Findings
): void {
  const demoted = new Map<string, GovernedPrompt>();
  for (const prompt of prompts) {
    const own = (prompt.owners.length > 0 ? prompt.owners : admins).join(' ');
    for (const file of prompt.contributors) {
      const line = owners.get(file);
      if (line !== undefined && line.join(' ') !== own && !demoted.has(file)) {
        demoted.set(file, prompt);
      }
    }
  }
  const named = (prompt: GovernedPrompt): string =>
    prompt.owners.length > 0 ? prompt.owners.join(' ') : 'the admins';
  for (const [file, prompt] of demoted) {
    if (prompt.file === file) {
      const sets = sortedUnique(prompts.filter((own) => own.file === file).map(named));
      findings.warn(
        `/${file} holds prompts of different owners (${sets.join('; ')}), so the admins review the file. Any one owner on a line can approve a change, so give prompts of different owners their own files.`
      );
    } else {
      findings.warn(
        `/${file} feeds prompt "${prompt.id}", whose owners (${named(prompt)}) differ from the owners of the file (${(owners.get(file) ?? []).join(' ')}), so the admins review the file. Any one owner on a line can approve a change. Keep shared blocks and @meta defaults in files without prompts, and give prompts of other owners their own files.`
      );
    }
    owners.set(file, admins);
  }
}

/**
 * Lines for the `.prs` files that define prompts, and admin lines for every other file
 * the project reads: inherited parents, `@use` imports and composed blocks.
 */
export async function sourceLines(
  repo: Repository,
  config: PromptScriptConfig,
  configPath: string,
  admins: string[],
  findings: Findings
): Promise<{ prompts: OwnerLine[]; sources: OwnerLine[] }> {
  const project = await resolveProject(repo, config, configPath);
  const prompts = governedPrompts(project, repo);
  const owners = fileOwners(prompts, admins, findings);
  demote(owners, prompts, admins, findings);
  const promptPaths = await keepPaths(sortedUnique(owners.keys()), repo, findings);
  const others = sortedUnique(
    project.sources.filter(isFile).flatMap((file) => {
      const path = repoPath(file, repo);
      return path === undefined || owners.has(path) ? [] : [path];
    })
  );
  const sourcePaths = await keepPaths(others, repo, findings);
  return {
    prompts: promptPaths.map((path) => ({ path: `/${path}`, owners: owners.get(path) ?? admins })),
    sources: sourcePaths.map((path) => ({ path: `/${path}`, owners: admins })),
  };
}
