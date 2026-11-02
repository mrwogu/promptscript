/**
 * Pins the @promptscript dependencies of the built library packages to the
 * exact lockstep version (workspace:* becomes 1.2.3) in dist/packages/<lib>.
 * Run it after the build and before nx release publish. Safe to run twice.
 * The private flag is left as it is.
 *
 * Usage: pnpm library:prepare-publish
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LIBRARIES, pinInternalDependencies, wiringFailures } from './library-packages.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const wiring = wiringFailures(root);
if (wiring.length > 0) {
  console.error('Library wiring check failed:');
  for (const message of wiring) console.error(`  - ${message}`);
  process.exit(1);
}

const cliManifest = JSON.parse(readFileSync(join(root, 'packages/cli/package.json'), 'utf8')) as {
  version: string;
};

for (const name of LIBRARIES) {
  const path = join(root, 'dist/packages', name, 'package.json');
  const manifest = pinInternalDependencies(
    JSON.parse(readFileSync(path, 'utf8')) as { dependencies?: Record<string, string> },
    cliManifest.version
  );
  writeFileSync(path, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`pinned @promptscript/${name} at ${cliManifest.version}`);
}
