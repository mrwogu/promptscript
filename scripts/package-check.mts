/**
 * Packs the library packages the way a registry would ship them and checks
 * the tarballs: publint, are-the-types-wrong, a plain Node import of every
 * package, one tiny compile, and a browser bundle of browser-compiler.
 *
 * Nothing is published. Needs network for the third-party dependencies.
 *
 * Usage: pnpm package:check
 * Exit codes:
 *   0 - All checks passed
 *   1 - At least one check failed (all failures are printed)
 */

import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { publint } from 'publint';
import { formatMessage } from 'publint/utils';
import {
  CODE_LIBRARIES,
  LIBRARIES,
  pinInternalDependencies,
  wiringFailures,
} from './library-packages.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// The libraries built from TypeScript. schemas has its own, smaller path below.
const PACKAGES = CODE_LIBRARIES;
const NODE_ENGINES = '>=22';
const SCOPE = '@promptscript';
const TEST_FILE = /((^|\/)__tests__\/)|(\.(spec|test)\.[cm]?[jt]s$)/;

interface Manifest {
  name?: string;
  version?: string;
  type?: string;
  main?: string;
  types?: string;
  exports?: Record<string, Record<string, string> | string>;
  files?: string[];
  engines?: { node?: string };
  license?: string;
  repository?: { directory?: string };
  dependencies?: Record<string, string>;
}

const failures: string[] = [];
const fail = (message: string): void => {
  failures.push(message);
};

const pnpmEntry = process.env.npm_execpath;
if (!pnpmEntry || !basename(pnpmEntry).includes('pnpm')) {
  console.error('Run this through pnpm (pnpm package:check).');
  process.exit(1);
}
const isScript = /\.[cm]?js$/.test(pnpmEntry);

function pnpm(args: string[], cwd: string, quiet = false): { ok: boolean; output: string } {
  const stdio = quiet ? 'pipe' : 'inherit';
  const result = isScript
    ? spawnSync(process.execPath, [pnpmEntry as string, ...args], { cwd, stdio, encoding: 'utf8' })
    : spawnSync(pnpmEntry as string, args, { cwd, stdio, encoding: 'utf8' });
  return { ok: result.status === 0, output: `${result.stdout ?? ''}${result.stderr ?? ''}` };
}

function readManifest(path: string): Manifest {
  return JSON.parse(readFileSync(path, 'utf8')) as Manifest;
}

function sameKeys(value: object | undefined, expected: string[]): boolean {
  return JSON.stringify(Object.keys(value ?? {})) === JSON.stringify(expected);
}

function checkManifest(name: string, manifest: Manifest, dir: string): void {
  const label = `${SCOPE}/${name}`;
  const entry = manifest.exports?.['.'];
  const entryObject = typeof entry === 'object' ? entry : undefined;
  if (manifest.type !== 'module') fail(`${label}: type must be "module"`);
  if (!sameKeys(manifest.exports, ['.', './package.json'])) {
    fail(`${label}: exports must be exactly "." and "./package.json"`);
  }
  if (!sameKeys(entryObject, ['types', 'default'])) {
    fail(`${label}: exports["."] must be exactly "types" and "default"`);
  }
  if (!entryObject || manifest.main !== entryObject.default) {
    fail(`${label}: main must equal exports["."].default`);
  }
  if (!entryObject || manifest.types !== entryObject.types) {
    fail(`${label}: types must equal exports["."].types`);
  }
  if (!Array.isArray(manifest.files) || manifest.files.length === 0) {
    fail(`${label}: files must be a non-empty array`);
  }
  if (manifest.engines?.node !== NODE_ENGINES)
    fail(`${label}: engines.node must be ${NODE_ENGINES}`);
  if (manifest.license !== 'MIT') fail(`${label}: license must be MIT`);
  if (manifest.repository?.directory !== `packages/${name}`) {
    fail(`${label}: repository.directory must be packages/${name}`);
  }
  for (const [dep, spec] of Object.entries(manifest.dependencies ?? {})) {
    if (dep.startsWith(`${SCOPE}/`) && spec !== manifest.version) {
      fail(`${label}: ${dep} must be pinned to ${manifest.version}, got ${spec}`);
    }
  }
  const shipped = (readdirSync(dir, { recursive: true }) as string[])
    .map((path) => path.replaceAll('\\', '/'))
    .filter((path) => !path.startsWith('node_modules/'));
  const shippedTests = shipped.filter((path) => TEST_FILE.test(path));
  if (shippedTests.length > 0)
    fail(`${label}: test files in the tarball: ${shippedTests.join(', ')}`);
  // They point at the TypeScript source, which is not in the tarball.
  const declarationMaps = shipped.filter((path) => path.endsWith('.d.ts.map'));
  if (declarationMaps.length > 0)
    fail(`${label}: declaration maps in the tarball: ${declarationMaps.join(', ')}`);
  // MIT asks for the notice in every copy, and npm does not add it by itself.
  if (
    !shipped.includes('LICENSE') ||
    !readFileSync(join(dir, 'LICENSE'), 'utf8').startsWith('MIT License')
  ) {
    fail(`${label}: the MIT LICENSE file is missing from the tarball`);
  }
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Pack from a copy outside the repo, so pnpm sees no workspace.
function packTarballs(tmp: string, distManifests: Map<string, Manifest>): string[] {
  const tarballs: string[] = [];
  const tarballDir = join(tmp, 'tarballs');
  mkdirSync(tarballDir);
  for (const name of PACKAGES) {
    const stage = join(tmp, 'stage', name);
    cpSync(join(root, 'dist/packages', name), stage, { recursive: true });
    const manifest = readManifest(join(stage, 'package.json'));
    try {
      // Outside the workspace pnpm cannot resolve workspace:*, so pin the lockstep version.
      pinInternalDependencies(manifest, manifest.version ?? '0.0.0');
    } catch (error) {
      fail(`${SCOPE}/${name}: ${errorText(error)}`);
    }
    for (const dep of Object.keys(manifest.dependencies ?? {})) {
      if (dep.startsWith(`${SCOPE}/`) && !distManifests.has(dep.slice(SCOPE.length + 1))) {
        fail(`${SCOPE}/${name}: depends on ${dep}, which is not a checked package`);
      }
    }
    writeFileSync(join(stage, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    const packed = pnpm(['pack', '--pack-destination', tarballDir], stage, true);
    if (packed.ok) {
      tarballs.push(join(tarballDir, `promptscript-${name}-${manifest.version}.tgz`));
    } else {
      fail(`${SCOPE}/${name}: pnpm pack failed\n${packed.output}`);
    }
  }
  return tarballs;
}

async function lintTarballs(tarballs: string[]): Promise<void> {
  for (const tarball of tarballs) {
    const buf = readFileSync(tarball);
    const tarballBytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    const options = { pack: { tarball: tarballBytes }, level: 'warning', strict: true } as const;
    const { messages, pkg } = await publint(options); // NOSONAR - in order keeps the output readable
    for (const message of messages)
      fail(`publint ${basename(tarball)}: ${formatMessage(message, pkg)}`);
    const attw = pnpm(['exec', 'attw', tarball, '--profile', 'esm-only'], root, true);
    if (!attw.ok) fail(`attw ${basename(tarball)}:\n${attw.output}`);
  }
}

// Install every tarball into one project, as a consumer would.
function installTarballs(smoke: string, tarballs: string[]): boolean {
  mkdirSync(smoke);
  writeFileSync(
    join(smoke, 'package.json'),
    JSON.stringify({ name: 'smoke', private: true, type: 'module' })
  );
  // Same age policy as the repo: no third-party release younger than a day.
  const before = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const install = spawnSync(
    'npm', // NOSONAR - fixed arguments, PATH lookup is how the tool is found
    ['install', '--no-audit', '--no-fund', '--ignore-scripts', `--before=${before}`, ...tarballs],
    { cwd: smoke, encoding: 'utf8', shell: process.platform === 'win32' }
  );
  if (install.status !== 0) {
    fail(`npm install of the tarballs failed\n${install.stdout}${install.stderr}`);
    return false;
  }
  for (const name of PACKAGES) {
    const dir = join(smoke, 'node_modules', SCOPE, name);
    checkManifest(name, readManifest(join(dir, 'package.json')), dir);
  }
  const lock = JSON.parse(readFileSync(join(smoke, 'package-lock.json'), 'utf8')) as {
    packages: Record<string, { resolved?: string }>;
  };
  for (const [path, entry] of Object.entries(lock.packages)) {
    if (path.includes(`node_modules/${SCOPE}/`) && !entry.resolved?.startsWith('file:')) {
      fail(`${path}: resolved from ${entry.resolved ?? 'nowhere'}, expected a local tarball`);
    }
  }
  return true;
}

// Plain Node, no loader: bare specifiers resolve from the smoke project.
function importAndCompile(smoke: string): void {
  const names = JSON.stringify(PACKAGES.map((name) => `${SCOPE}/${name}`));
  writeFileSync(
    join(smoke, 'project.prs'),
    '@meta {\n  id: "smoke"\n  syntax: "1.0.0"\n}\n\n@identity {\n  """\n  You are a smoke test.\n  """\n}\n'
  );
  writeFileSync(
    join(smoke, 'smoke.mjs'),
    `const names = ${names};
import { readFileSync } from 'node:fs';
for (const name of names) {
  const mod = await import(name);
  if (Object.keys(mod).length === 0) throw new Error(name + ' has no exports');
  await import(name + '/package.json', { with: { type: 'json' } });
  const deep = await import(name + '/src/index.js').catch((error) => error);
  if (deep?.code !== 'ERR_PACKAGE_PATH_NOT_EXPORTED') throw new Error(name + ' allows deep imports');
}
const { compile } = await import('${SCOPE}/compiler');
const nodeResult = await compile('project.prs');
if (!nodeResult.success || nodeResult.outputs.size === 0) throw new Error('compiler: compile failed');
const browser = await import('${SCOPE}/browser-compiler');
const source = readFileSync('project.prs', 'utf8');
const browserResult = await browser.compile({ 'project.prs': source }, 'project.prs');
if (!browserResult.success || browserResult.outputs.size === 0) throw new Error('browser-compiler: compile failed');
`
  );
  const result = spawnSync(process.execPath, ['smoke.mjs'], { cwd: smoke, encoding: 'utf8' });
  if (result.status !== 0)
    fail(`import and compile smoke failed\n${result.stdout}${result.stderr}`);
}

// A Node built-in or an unresolvable import on the browser path throws here.
async function bundleForBrowser(smoke: string): Promise<void> {
  try {
    await build({
      stdin: {
        contents: `export { compile } from '${SCOPE}/browser-compiler';`,
        resolveDir: smoke,
      },
      bundle: true,
      platform: 'browser',
      format: 'esm',
      write: false,
      logLevel: 'silent',
    });
  } catch (error) {
    fail(`browser bundle of browser-compiler failed: ${errorText(error)}`);
  }
}

// schemas has no code: pack, publint, install, and import every exported JSON file.
async function checkSchemas(tmp: string): Promise<void> {
  const label = `${SCOPE}/schemas`;
  const stage = join(tmp, 'stage', 'schemas');
  const tarballDir = join(tmp, 'tarballs-schemas');
  mkdirSync(tarballDir);
  cpSync(join(root, 'dist/packages/schemas'), stage, { recursive: true });
  const manifest = readManifest(join(stage, 'package.json'));
  const packed = pnpm(['pack', '--pack-destination', tarballDir], stage, true);
  if (!packed.ok) {
    fail(`${label}: pnpm pack failed\n${packed.output}`);
    return;
  }
  const tarball = join(tarballDir, `promptscript-schemas-${manifest.version}.tgz`);
  const buf = readFileSync(tarball);
  const tarballBytes = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const { messages, pkg } = await publint({
    pack: { tarball: tarballBytes },
    level: 'warning',
    strict: true,
  });
  for (const message of messages)
    fail(`publint ${basename(tarball)}: ${formatMessage(message, pkg)}`);

  const smoke = join(tmp, 'smoke-schemas');
  mkdirSync(smoke);
  writeFileSync(
    join(smoke, 'package.json'),
    JSON.stringify({ name: 'smoke-schemas', private: true, type: 'module' })
  );
  const install = spawnSync(
    'npm', // NOSONAR - fixed arguments, PATH lookup is how the tool is found
    ['install', '--no-audit', '--no-fund', '--ignore-scripts', tarball],
    { cwd: smoke, encoding: 'utf8', shell: process.platform === 'win32' }
  );
  if (install.status !== 0) {
    fail(`npm install of ${label} failed\n${install.stdout}${install.stderr}`);
    return;
  }
  const dir = join(smoke, 'node_modules', SCOPE, 'schemas');
  const installed = readManifest(join(dir, 'package.json'));
  if (!existsSync(join(dir, 'LICENSE'))) fail(`${label}: the MIT LICENSE file is missing`);
  const files = Object.keys(installed.exports ?? {}).filter(
    (key) => key.endsWith('.json') && key !== './package.json'
  );
  if (files.length === 0) fail(`${label}: no JSON file is exported`);
  writeFileSync(
    join(smoke, 'schemas.mjs'),
    `const files = ${JSON.stringify(files)};
for (const file of files) {
  const mod = await import('${label}/' + file.slice(2), { with: { type: 'json' } });
  if (typeof mod.default.$id !== 'string' || !mod.default.$id.startsWith('https://')) {
    throw new Error(file + ' has no $id');
  }
}
`
  );
  const result = spawnSync(process.execPath, ['schemas.mjs'], { cwd: smoke, encoding: 'utf8' });
  if (result.status !== 0) fail(`schemas import failed\n${result.stdout}${result.stderr}`);
}

async function run(tmp: string): Promise<void> {
  const distManifests = new Map<string, Manifest>();
  for (const name of PACKAGES) {
    distManifests.set(name, readManifest(join(root, 'dist/packages', name, 'package.json')));
  }
  const tarballs = packTarballs(tmp, distManifests);
  if (failures.length > 0) return;
  await lintTarballs(tarballs);
  const smoke = join(tmp, 'smoke');
  if (!installTarballs(smoke, tarballs)) return;
  importAndCompile(smoke);
  await bundleForBrowser(smoke);
  await checkSchemas(tmp);
}

const wiring = wiringFailures(root);
if (wiring.length > 0) {
  console.error('Library wiring check failed:');
  for (const message of wiring) console.error(`  - ${message}`);
  process.exit(1);
}

console.log('Building the library packages...');
if (!pnpm(['nx', 'run-many', '-t', 'build', '-p', LIBRARIES.join(',')], root).ok) {
  console.error('Build failed, cannot pack.');
  process.exit(1);
}
const tmp = mkdtempSync(join(tmpdir(), 'prs-package-check-'));
try {
  await run(tmp);
} catch (error) {
  fail(
    `unexpected error: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`
  );
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

if (failures.length > 0) {
  console.error(`\nPackage check failed (${failures.length}):`);
  for (const message of failures) console.error(`  - ${message}`);
  process.exit(1);
}
console.log(`\nPackage check passed for ${LIBRARIES.length} packages.`);
