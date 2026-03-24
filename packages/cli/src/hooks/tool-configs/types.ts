export interface ToolHookConfig {
  name: string;
  detectPaths: string[];
  settingsPath: string;
  timeoutUnit: 'seconds' | 'milliseconds' | 'n/a';
  generatePreEditHook(prsPath: string): Record<string, unknown>;
  generatePostEditHook(prsPath: string): Record<string, unknown>;
  mergeIntoSettings(existing: Record<string, unknown>, prsPath: string): Record<string, unknown>;
  removeFromSettings(existing: Record<string, unknown>): Record<string, unknown>;
}
