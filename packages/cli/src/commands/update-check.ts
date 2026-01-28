import { getPackageVersion } from '@promptscript/core';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ConsoleOutput } from '../output/console.js';
import { forceCheckForUpdates } from '../utils/version-check.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Check for CLI updates command.
 * Always checks online (ignores cache) and displays current version + status.
 */
export async function updateCheckCommand(): Promise<void> {
  const currentVersion = getPackageVersion(__dirname, '../../package.json');

  // Print current version
  console.log(`@promptscript/cli v${currentVersion}`);

  // Force check for updates
  const { info, error } = await forceCheckForUpdates(currentVersion);

  if (error) {
    ConsoleOutput.error('Could not check for updates');
    process.exitCode = 1;
    return;
  }

  if (info?.updateAvailable) {
    console.log(
      `Update available: ${info.currentVersion} \u2192 ${info.latestVersion} (npm i -g @promptscript/cli)`
    );
  } else {
    ConsoleOutput.success('Up to date');
  }
}
