/**
 * Checks (or updates) the API report of every package that has an
 * api-extractor.json. The report lists the exported API, so a change in
 * the public surface shows up as a diff in review.
 *
 * Usage: pnpm api:check   (compare only)
 *        pnpm api:update  (rewrite the committed reports)
 * Exit codes:
 *   0 - Reports are up to date (check) or written (update)
 *   1 - Report is out of date or missing (check), or api-extractor failed
 */

import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const update = process.argv.includes('--update');

const names = readdirSync(resolve(root, 'packages'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((name) => existsSync(resolve(root, 'packages', name, 'api-extractor.json')))
  .sort((a, b) => a.localeCompare(b));

if (names.length === 0) {
  console.error('No packages with api-extractor.json found.');
  process.exit(1);
}

// The report is built from the real build output. Nx cache makes this cheap.
// pnpm is a .cmd shim on Windows, so it needs a shell there. Arguments are fixed.
const build = spawnSync('pnpm', ['nx', 'run-many', '-t', 'build', '-p', names.join(',')], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
}); // NOSONAR
if (build.status !== 0) {
  console.error(
    `Build failed, cannot analyze the API.${build.error ? ` ${build.error.message}` : ''}`
  );
  process.exit(1);
}

let failed = false;

for (const name of names) {
  const packageDir = resolve(root, 'packages', name);
  const configPath = resolve(packageDir, 'api-extractor.json');
  if (update) {
    mkdirSync(resolve(packageDir, 'api'), { recursive: true });
  }

  const config = ExtractorConfig.loadFileAndPrepare(configPath);
  const result = Extractor.invoke(config, { localBuild: update, showVerboseMessages: false });

  const fileName = config.reportConfigs[0].fileName;
  const report = relative(root, resolve(config.reportFolder, fileName));

  if (!result.succeeded) {
    failed = true;
    if (!update && result.apiReportChanged) {
      const temp = relative(root, resolve(config.reportTempFolder, fileName));
      console.error(`\nAPI report for ${config.packageJson?.name ?? name} is out of date.`);
      console.error(`  Compare: git diff --no-index ${report} ${temp}`);
      console.error(`  Fix:     pnpm api:update, review the diff, commit ${report}`);
    } else {
      console.error(
        `api-extractor failed for ${name}: ${result.errorCount} error(s), ${result.warningCount} warning(s), see above.`
      );
    }
  } else if (update) {
    console.log(
      `${name}: API report ${result.apiReportChanged ? 'updated' : 'unchanged'} (${report})`
    );
  }
}

if (failed) {
  process.exit(1);
}
if (!update) {
  console.log('API reports are up to date.');
}
