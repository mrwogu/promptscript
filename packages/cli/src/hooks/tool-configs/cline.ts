import type { ToolHookConfig } from './types.js';

export const clineConfig: ToolHookConfig = {
  name: 'cline',
  detectPaths: ['.clinerules'],
  settingsPath: '.clinerules/hooks/',
  timeoutUnit: 'n/a',

  generatePreEditHook(prsPath: string): Record<string, unknown> {
    return {
      scriptPath: '.clinerules/hooks/prs-pre-edit.sh',
      content: `#!/bin/bash\n${prsPath} hook pre-edit`,
    };
  },

  generatePostEditHook(prsPath: string): Record<string, unknown> {
    return {
      scriptPath: '.clinerules/hooks/prs-post-edit.sh',
      content: `#!/bin/bash\n${prsPath} hook post-edit`,
    };
  },

  mergeIntoSettings(existing: Record<string, unknown>, _prsPath: string): Record<string, unknown> {
    return existing;
  },

  removeFromSettings(existing: Record<string, unknown>): Record<string, unknown> {
    return existing;
  },
};
