import { chmodSync, lstatSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { compareVersions, getLatestSyntaxVersion } from '@promptscript/core';
import { parse } from '@promptscript/parser';
import { fixSyntaxVersion, discoverPrsFiles } from './validate.js';
import { ConsoleOutput } from '../output/console.js';

export interface UpgradeOptions {
  dryRun?: boolean;
}

interface UpgradePlan {
  filePath: string;
  originalContent: string;
  content: string;
  declaredVersion: string;
}

function writeUpgrade(filePath: string, content: string, mode: number): void {
  const temporaryPath = `${filePath}.upgrade-${process.pid}-${randomUUID()}.tmp`;
  try {
    writeFileSync(temporaryPath, content, { encoding: 'utf-8', mode });
    chmodSync(temporaryPath, mode);
    renameSync(temporaryPath, filePath);
  } catch (error) {
    try {
      unlinkSync(temporaryPath);
    } catch {
      // The temporary file may not have been created.
    }
    throw error;
  }
}

/**
 * Upgrade all .prs files to the latest syntax version.
 */
export async function upgradeCommand(options: UpgradeOptions): Promise<void> {
  const latest = getLatestSyntaxVersion();
  let files: string[];
  try {
    files = discoverPrsFiles('.promptscript', true, true).sort();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    ConsoleOutput.error(`Cannot scan .promptscript: ${message}`);
    process.exitCode = 1;
    return;
  }
  const plans: UpgradePlan[] = [];

  let skippedCount = 0;
  let errorCount = 0;

  for (const filePath of files) {
    try {
      const stats = lstatSync(filePath);
      if (stats.isSymbolicLink()) {
        ConsoleOutput.warning(`Skipped symbolic link: ${filePath}`);
        skippedCount++;
        continue;
      }

      const content = readFileSync(filePath, 'utf-8');
      const result = parse(content, { filename: filePath });
      if (result.errors.length > 0 || !result.ast) {
        const message = result.errors[0]?.message ?? 'Unable to parse file';
        ConsoleOutput.error(`Cannot upgrade ${filePath}: ${message}`);
        errorCount++;
        continue;
      }

      const declaredVersion = result.ast.meta?.fields?.['syntax'];
      if (declaredVersion === undefined) {
        console.log(`Skipped:  ${filePath} (no syntax version)`);
        skippedCount++;
        continue;
      }
      if (typeof declaredVersion !== 'string') {
        ConsoleOutput.error(`Cannot upgrade ${filePath}: syntax version must be a string`);
        errorCount++;
        continue;
      }

      const comparison = compareVersions(declaredVersion, latest);
      if (comparison === 0) {
        console.log(`Skipped:  ${filePath} (already at ${declaredVersion})`);
        skippedCount++;
        continue;
      }
      if (comparison > 0) {
        ConsoleOutput.error(
          `Cannot upgrade ${filePath}: syntax ${declaredVersion} is newer than supported ${latest}`
        );
        errorCount++;
        continue;
      }

      const fixed = fixSyntaxVersion(content, declaredVersion, latest, result.ast.meta?.loc.offset);
      if (!fixed) {
        ConsoleOutput.error(`Cannot upgrade ${filePath}: unable to locate syntax version`);
        errorCount++;
        continue;
      }

      plans.push({
        filePath,
        originalContent: content,
        content: fixed,
        declaredVersion,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ConsoleOutput.error(`Cannot upgrade ${filePath}: ${message}`);
      errorCount++;
    }
  }

  if (errorCount > 0) {
    ConsoleOutput.error(
      `Upgrade aborted with ${errorCount} error(s); no PromptScript files were changed.`
    );
    process.exitCode = 1;
    return;
  }

  if (!options.dryRun) {
    for (const plan of plans) {
      try {
        const stats = lstatSync(plan.filePath);
        if (stats.isSymbolicLink()) {
          throw new Error('file became a symbolic link during upgrade');
        }
        if (readFileSync(plan.filePath, 'utf-8') !== plan.originalContent) {
          throw new Error('file changed during upgrade');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ConsoleOutput.error(`Upgrade aborted: ${plan.filePath}: ${message}`);
        process.exitCode = 1;
        return;
      }
    }
  }

  let upgradedCount = 0;
  for (const plan of plans) {
    if (options.dryRun) {
      console.log(`Would upgrade: ${plan.filePath}  "${plan.declaredVersion}" \u2192 "${latest}"`);
      upgradedCount++;
      continue;
    }

    try {
      const currentStats = lstatSync(plan.filePath);
      if (currentStats.isSymbolicLink()) {
        throw new Error('file became a symbolic link during upgrade');
      }
      writeUpgrade(plan.filePath, plan.content, currentStats.mode & 0o7777);
      console.log(`Upgraded: ${plan.filePath}  "${plan.declaredVersion}" \u2192 "${latest}"`);
      upgradedCount++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      ConsoleOutput.error(`Failed to upgrade ${plan.filePath}: ${message}`);
      process.exitCode = 1;
      return;
    }
  }

  const verb = options.dryRun ? 'would be upgraded' : 'upgraded';
  console.log(`\n${upgradedCount} file(s) ${verb}, ${skippedCount} skipped.`);
}
