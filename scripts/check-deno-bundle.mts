#!/usr/bin/env node
/**
 * Static Deno portability checks for the built @promptscript/cli bundle
 * (issue #486).
 *
 * Guards the invariants the Deno support relies on, so a refactor cannot
 * silently break `deno run npm:@promptscript/cli` or `deno compile`:
 * - the published package carries the spawnable worker and the bin shim
 * - the version and the SKILL.md are inlined (no package-relative reads)
 * - Node builtins use the node: prefix Deno requires
 * - no `process.execPath -e <inline script>` self-spawn remains
 * - no realpathSync.native call (Deno lacks it)
 *
 * Usage:
 *   node --import @swc-node/register/esm-register scripts/check-deno-bundle.mts [cliPackageDir]
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI_PACKAGE_DIR = resolve(process.argv[2] ?? join(REPO_ROOT, 'dist', 'packages', 'cli'));

/** Node builtin module names; under Deno every specifier needs node:. */
const NODE_BUILTINS = [
  'assert',
  'async_hooks',
  'buffer',
  'child_process',
  'cluster',
  'console',
  'constants',
  'crypto',
  'dgram',
  'diagnostics_channel',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'http2',
  'https',
  'inspector',
  'module',
  'net',
  'os',
  'path',
  'perf_hooks',
  'process',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'sys',
  'timers',
  'tls',
  'trace_events',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'wasi',
  'worker_threads',
  'zlib',
] as const;

/** Specifier positions where a builtin may appear (static/dynamic/CJS). */
const BARE_BUILTIN_PATTERN = new RegExp(
  `(?:\\bfrom\\s+|\\brequire\\s*\\(\\s*|\\bimport\\s*\\(\\s*|\\bimport\\s+)['"](${NODE_BUILTINS.join('|')})['"]`
);

/** Relative import of package.json - the pre-#486 version-read pattern. */
const RELATIVE_PACKAGE_JSON_PATTERN =
  /(?:\bfrom\s+|\brequire\s*\(\s*|\bimport\s*\(\s*|\bimport\s+)['"]\.{1,2}\/[^'"]*package\.json['"]/;

/** import.meta.url-based package.json guess, another pre-#486 pattern. */
const URL_PACKAGE_JSON_PATTERN = /new\s+URL\([^)]*package\.json/;

const failures: string[] = [];

function check(condition: boolean, message: string): void {
  if (!condition) {
    failures.push(message);
  }
}

interface DistPackageJson {
  version?: string;
  main?: string;
  bin?: string | { prs?: string };
}

const packageJsonPath = join(CLI_PACKAGE_DIR, 'package.json');
check(existsSync(packageJsonPath), 'dist package.json is missing');
const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as DistPackageJson;
check(
  typeof pkg.version === 'string' && /^\d+\.\d+\.\d+/.test(pkg.version),
  'dist package.json has no semver version'
);
const version = pkg.version ?? '';

const mainFile = (pkg.main ?? '').replace(/^\.\//, '');
const binFile =
  typeof pkg.bin === 'string'
    ? pkg.bin.replace(/^\.\//, '')
    : (pkg.bin?.prs ?? '').replace(/^\.\//, '');

const bundleFiles = [mainFile, 'managed-output-worker.js', binFile].filter((file) => file !== '');
const bundles: Array<[string, string]> = [];
for (const file of bundleFiles) {
  const path = join(CLI_PACKAGE_DIR, file);
  if (!existsSync(path)) {
    failures.push(`bundle file missing: ${file}`);
    continue;
  }
  bundles.push([file, readFileSync(path, 'utf-8')]);
}

for (const [file, source] of bundles) {
  const bareMatch = source.match(BARE_BUILTIN_PATTERN);
  check(
    bareMatch === null,
    `${file}: bare Node builtin import "${bareMatch?.[1]}" - Deno requires the node: prefix`
  );

  check(
    !RELATIVE_PACKAGE_JSON_PATTERN.test(source),
    `${file}: imports package.json by relative path - the version must be inlined at build time`
  );
  check(
    !URL_PACKAGE_JSON_PATTERN.test(source),
    `${file}: reads package.json through new URL() - the version must be inlined at build time`
  );
  // portableRealpathSync probes realpathSync.native (undefined on Deno) and
  // falls back, so only a direct call to the native binding is a violation.
  check(
    !/realpathSync\.native\s*\(/.test(source),
    `${file}: calls realpathSync.native directly - Deno has no native realpath, use portableRealpathSync`
  );

  for (const line of source.split('\n')) {
    check(
      !(line.includes('execPath') && /['"]-e['"]/.test(line)),
      `${file}: spawns process.execPath with -e inline script - guarded ops must go through the worker file`
    );
  }
}

for (const [file, source] of bundles) {
  if (file === binFile) {
    continue;
  }
  check(
    source.includes('__managed-output-worker'),
    `${file}: managed output worker command is missing from the bundle`
  );
}

const mainBundle = bundles.find(([file]) => file === mainFile)?.[1];
if (mainBundle !== undefined) {
  check(
    mainBundle.includes(`"${version}"`),
    'main bundle does not inline the package version (cli-version.ts build-time inlining regressed)'
  );
  check(
    mainBundle.includes('name: promptscript'),
    'main bundle does not embed the SKILL.md content (bundled-skill embedding regressed)'
  );
  check(
    mainBundle.includes('managed-output-worker.js'),
    'main bundle no longer resolves the worker module next to itself'
  );
}

if (failures.length > 0) {
  console.error(`Deno bundle checks failed (${failures.length}):`);
  for (const failure of failures) {
    console.error(`  - ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Deno bundle checks passed (${bundles.length} bundle files inspected in ${CLI_PACKAGE_DIR})`
);
