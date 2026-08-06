import { ConsoleOutput } from '../output/console.js';
import { setUserTelemetryEnabled } from '../telemetry/config.js';
import { telemetryStatus } from '../telemetry/session.js';

export type TelemetryAction = 'status' | 'enable' | 'disable';

export async function telemetryCommand(action: string): Promise<void> {
  if (action === 'enable') {
    await setUserTelemetryEnabled(true);
    ConsoleOutput.success('Anonymous usage telemetry enabled in user config');
    return;
  }
  if (action === 'disable') {
    await setUserTelemetryEnabled(false);
    ConsoleOutput.success('Anonymous usage telemetry disabled in user config');
    return;
  }
  if (action !== 'status') {
    ConsoleOutput.error('Action must be status, enable, or disable');
    process.exitCode = 1;
    return;
  }

  const { config, spool, state } = await telemetryStatus();
  console.log(`Enabled: ${config.enabled ? 'yes' : 'no'}`);
  console.log(`Endpoint: ${config.endpoint}`);
  console.log(`Spool records: ${spool.records}`);
  console.log(`Spool bytes: ${spool.bytes}`);
  console.log(`Last attempt: ${state.lastAttempt ?? 'never'}`);
  console.log(`Last success: ${state.lastSuccess ?? 'never'}`);
  console.log(`Last error: ${state.lastError ?? 'none'}`);
  if (config.vetoes.length > 0) {
    console.log(`Disabled by: ${config.vetoes.join(', ')}`);
  }
}
