import { readFileSync, writeFileSync } from 'node:fs';
import { getLatestSyntaxVersion } from '@promptscript/core';
import { parse } from '@promptscript/parser';
import { fixSyntaxVersion, discoverPrsFiles } from './validate.js';

export interface UpgradeOptions {
  dryRun?: boolean;
}

/**
 * Upgrade all .prs files to the latest syntax version.
 */
export async function upgradeCommand(options: UpgradeOptions): Promise<void> {
  const latest = getLatestSyntaxVersion();
  const files = discoverPrsFiles('.promptscript');

  let upgradedCount = 0;
  let skippedCount = 0;

  for (const filePath of files) {
    const content = readFileSync(filePath, 'utf-8');
    const result = parse(content);

    if (!result.ast?.meta?.fields?.['syntax']) {
      skippedCount++;
      continue;
    }

    const declaredVersion = result.ast.meta.fields['syntax'];
    if (typeof declaredVersion !== 'string') {
      skippedCount++;
      continue;
    }

    const fixed = fixSyntaxVersion(content, declaredVersion, latest);
    if (!fixed) {
      console.log(`Skipped:  ${filePath} (already at ${declaredVersion})`);
      skippedCount++;
      continue;
    }

    if (options.dryRun) {
      console.log(`Would upgrade: ${filePath}  "${declaredVersion}" \u2192 "${latest}"`);
    } else {
      writeFileSync(filePath, fixed, 'utf-8');
      console.log(`Upgraded: ${filePath}  "${declaredVersion}" \u2192 "${latest}"`);
    }
    upgradedCount++;
  }

  const verb = options.dryRun ? 'would be upgraded' : 'upgraded';
  console.log(`\n${upgradedCount} file(s) ${verb}, ${skippedCount} skipped.`);
}
