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

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, relative, resolve } from 'node:path';
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
// pnpm sets npm_execpath to its own entry (a JS file, or a standalone binary), so the
// build starts from an absolute path and needs no PATH lookup.
const pnpmEntry = process.env.npm_execpath;
if (!pnpmEntry || !basename(pnpmEntry).includes('pnpm')) {
  console.error('Run this through pnpm (pnpm api:check or pnpm api:update).');
  process.exit(1);
}
const buildArgs = ['nx', 'run-many', '-t', 'build', '-p', names.join(',')];
const isScript = /\.[cm]?js$/.test(pnpmEntry);
const build = isScript
  ? spawnSync(process.execPath, [pnpmEntry, ...buildArgs], { cwd: root, stdio: 'inherit' })
  : spawnSync(pnpmEntry, buildArgs, { cwd: root, stdio: 'inherit' });
if (build.status !== 0) {
  const reason = build.error ? ` ${build.error.message}` : '';
  console.error(`Build failed, cannot analyze the API.${reason}`);
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
  const reportPath = resolve(config.reportFolder, fileName);
  const tempPath = resolve(config.reportTempFolder, fileName);
  const report = relative(root, reportPath);

  // api-extractor ignores whitespace when it compares reports, so compare the files here.
  const readReport = (path: string): string | undefined =>
    existsSync(path) ? readFileSync(path, 'utf8').replaceAll('\r\n', '\n') : undefined;
  // A changed report makes api-extractor fail in check mode, that is not an extractor failure.
  const otherFailure = result.errorCount > 0 || (!result.succeeded && !result.apiReportChanged);
  const differs =
    !otherFailure && (result.apiReportChanged || readReport(tempPath) !== readReport(reportPath));

  if (otherFailure) {
    failed = true;
    console.error(
      `api-extractor failed for ${name}: ${result.errorCount} error(s), ${result.warningCount} warning(s), see above.`
    );
  } else if (differs && update) {
    if (readReport(tempPath) !== readReport(reportPath)) {
      copyFileSync(tempPath, reportPath);
    }
    console.log(`${name}: API report updated (${report})`);
  } else if (differs) {
    failed = true;
    console.error(`\nAPI report for ${config.packageJson?.name ?? name} is out of date.`);
    console.error(`  Compare: git diff --no-index ${report} ${relative(root, tempPath)}`);
    console.error(`  Fix:     pnpm api:update, review the diff, commit ${report}`);
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
