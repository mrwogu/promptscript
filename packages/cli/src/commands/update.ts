import type { UpdateOptions } from '../types.js';
import { lockCommand } from './lock.js';

/**
 * Re-resolve versions (ignoring current lockfile pins) and update promptscript.lock.
 *
 * When a package argument is provided, only that dependency is updated.
 * Otherwise all dependencies are re-resolved.
 *
 */
export async function updateCommand(
  packageArg: string | undefined,
  options: UpdateOptions
): Promise<void> {
  await lockCommand({
    command: 'update',
    dryRun: options.dryRun,
    update: true,
    updatePackage: packageArg,
  });
}
