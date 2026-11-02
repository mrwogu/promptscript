/**
 * The library packages that ship in lockstep with the CLI, and the checks
 * that keep their release wiring in one piece. Nothing is published while
 * LIBRARIES_PUBLISHED is false, the packages stay private.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const SCOPE = '@promptscript';

// Order matters for readability only, nx works out the build order itself.
export const LIBRARIES = [
  'core',
  'parser',
  'resolver',
  'validator',
  'formatters',
  'compiler',
  'browser-compiler',
  'schemas',
] as const;

// Libraries that are built from TypeScript. schemas only ships JSON files.
export const CODE_LIBRARIES = LIBRARIES.filter((name) => name !== 'schemas');

// Flip to true in the PR that removes "private" from the manifests.
export const LIBRARIES_PUBLISHED = false;

const NODE_ENGINES = '>=22';
const WORKSPACE_ANY = 'workspace:*';

interface LibraryManifest {
  name?: string;
  version?: string;
  private?: boolean;
  engines?: { node?: string };
  publishConfig?: { access?: string };
  dependencies?: Record<string, string>;
}

/**
 * Replaces workspace:* with the exact version for every @promptscript
 * dependency. Any other spec for a @promptscript package throws, a range
 * would let the libraries drift apart from each other.
 */
export function pinInternalDependencies<T extends { dependencies?: Record<string, string> }>(
  manifest: T,
  version: string
): T {
  const dependencies = manifest.dependencies;
  if (!dependencies) return manifest;
  for (const [name, spec] of Object.entries(dependencies)) {
    if (!name.startsWith(`${SCOPE}/`)) continue;
    if (spec === WORKSPACE_ANY) {
      dependencies[name] = version;
    } else if (spec !== version) {
      throw new Error(`${name}: expected "${WORKSPACE_ANY}" or "${version}", got "${spec}"`);
    }
  }
  return manifest;
}

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

function manifestFailures(name: string, manifest: LibraryManifest, cliVersion: string): string[] {
  const label = `${SCOPE}/${name}`;
  const failures: string[] = [];
  if (manifest.name !== label) failures.push(`${label}: name is ${manifest.name}`);
  if (manifest.version !== cliVersion) {
    failures.push(
      `${label}: version ${manifest.version} differs from the CLI version ${cliVersion}`
    );
  }
  if ((manifest.private === true) !== !LIBRARIES_PUBLISHED) {
    failures.push(
      `${label}: private must be ${!LIBRARIES_PUBLISHED} while LIBRARIES_PUBLISHED is ${LIBRARIES_PUBLISHED}`
    );
  }
  if (manifest.publishConfig?.access !== 'public') {
    failures.push(`${label}: publishConfig.access must be "public"`);
  }
  if (manifest.engines?.node !== NODE_ENGINES) {
    failures.push(`${label}: engines.node must be ${NODE_ENGINES}`);
  }
  const known = new Set<string>(LIBRARIES);
  for (const dep of Object.keys(manifest.dependencies ?? {})) {
    if (dep.startsWith(`${SCOPE}/`) && !known.has(dep.slice(SCOPE.length + 1))) {
      failures.push(`${label}: depends on ${dep}, which is not a library package`);
    }
  }
  return failures;
}

/** Everything that must hold for the libraries to release with the CLI. */
export function wiringFailures(root: string): string[] {
  const failures: string[] = [];
  const cliVersion = readJson<LibraryManifest>(join(root, 'packages/cli/package.json')).version;
  if (!cliVersion) return ['packages/cli/package.json has no version'];

  const releaseManifest = readJson<Record<string, string>>(
    join(root, '.release-please-manifest.json')
  );
  if (releaseManifest['.'] !== cliVersion) {
    failures.push(
      `.release-please-manifest.json is ${releaseManifest['.']}, the CLI is ${cliVersion}`
    );
  }
  const releaseConfig = readJson<{ packages?: Record<string, { 'extra-files'?: string[] }> }>(
    join(root, 'release-please-config.json')
  );
  const extraFiles = releaseConfig.packages?.['.']?.['extra-files'] ?? [];
  const nxRelease = readJson<{ release?: { projects?: string[] } }>(join(root, 'nx.json'));
  const nxProjects = nxRelease.release?.projects ?? [];

  for (const name of LIBRARIES) {
    const path = `packages/${name}/package.json`;
    if (!extraFiles.includes(path))
      failures.push(`release-please-config.json: extra-files misses ${path}`);
    if (!nxProjects.includes(name)) failures.push(`nx.json: release.projects misses ${name}`);
    const project = readJson<{ targets?: Record<string, { options?: { packageRoot?: string } }> }>(
      join(root, `packages/${name}/project.json`)
    );
    if (project.targets?.['nx-release-publish']?.options?.packageRoot !== 'dist/{projectRoot}') {
      failures.push(
        `packages/${name}/project.json: nx-release-publish.options.packageRoot must be dist/{projectRoot}`
      );
    }
    failures.push(
      ...manifestFailures(name, readJson<LibraryManifest>(join(root, path)), cliVersion)
    );
  }
  return failures;
}
