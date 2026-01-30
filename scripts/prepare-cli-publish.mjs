#!/usr/bin/env node
/**
 * Prepares package.json for publishing by removing workspace dependencies
 * (which are bundled by esbuild) and keeping only external dependencies.
 *
 * Also fixes version detection paths in the bundled code.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const cliRoot = join(root, 'packages/cli');
const distRoot = join(root, 'dist/packages/cli');

const pkg = JSON.parse(readFileSync(join(cliRoot, 'package.json'), 'utf-8'));
const resolverPkg = JSON.parse(readFileSync(join(root, 'packages/resolver/package.json'), 'utf-8'));

// Fix version detection paths in bundled index.js
// After bundling, all code is in index.js and package.json is in the same directory.
// Source paths like '../package.json' and '../../package.json' need to be './package.json'.
const indexPath = join(distRoot, 'index.js');
let indexContent = readFileSync(indexPath, 'utf-8');
// Replace getPackageVersion calls with incorrect relative paths
indexContent = indexContent.replace(
  /getPackageVersion\(__dirname\d*, ["']\.\.\/package\.json["']\)/g,
  'getPackageVersion(__dirname3, "./package.json")'
);
indexContent = indexContent.replace(
  /getPackageVersion\(__dirname\d*, ["']\.\.\/\.\.\/package\.json["']\)/g,
  'getPackageVersion(__dirname3, "./package.json")'
);
writeFileSync(indexPath, indexContent);
console.log('✓ Fixed version detection paths in bundled code');

// Remove workspace dependencies (they are bundled)
const dependencies = Object.fromEntries(
  Object.entries(pkg.dependencies || {}).filter(([, version]) => !version.startsWith('workspace:'))
);

// Add transitive dependencies that are marked as external in esbuild
// (simple-git from resolver is CJS and cannot be bundled into ESM)
dependencies['simple-git'] = resolverPkg.dependencies['simple-git'];

const publishPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  keywords: pkg.keywords,
  repository: pkg.repository,
  license: 'MIT',
  publishConfig: pkg.publishConfig,
  type: pkg.type,
  main: pkg.main,
  types: pkg.types,
  bin: pkg.bin,
  engines: {
    node: '>=18',
  },
  dependencies,
};

writeFileSync(join(distRoot, 'package.json'), JSON.stringify(publishPkg, null, 2) + '\n');

console.log('✓ Generated package.json for publishing');
