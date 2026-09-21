import { CLI_VERSION } from '../cli-version.js';
import { ConsoleOutput } from '../output/console.js';
import { forceCheckForUpdates } from '../utils/version-check.js';

/**
 * Check for CLI updates command.
 * Always checks online (ignores cache) and displays current version + status.
 */
export async function updateCheckCommand(): Promise<void> {
  const currentVersion = CLI_VERSION;

  // Print current version
  console.log(`@promptscript/cli v${currentVersion}`);

  // Skip network check if explicitly disabled
  if (process.env['PROMPTSCRIPT_NO_UPDATE_CHECK']) {
    ConsoleOutput.success('Update check disabled (PROMPTSCRIPT_NO_UPDATE_CHECK)');
    return;
  }

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
