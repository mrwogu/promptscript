import type { ToolHookConfig } from './types.js';

function isPromptScriptClineHook(content: string, action: 'pre-edit' | 'post-edit'): boolean {
  const normalized = content.replace(/\r\n/g, '\n').trimEnd();
  const command = `(?:[A-Za-z0-9._~:/\\\\-]+[\\\\/])?prs(?:\\.cmd)? hook ${action}`;
  return (
    new RegExp(`^#!/bin/bash\\n${command}$`).test(normalized) ||
    new RegExp(`^#!/bin/bash\\n# promptscript-generated:cline-${action}\\n${command}$`).test(
      normalized
    )
  );
}

export const clineConfig: ToolHookConfig = {
  name: 'cline',
  detectPaths: ['.clinerules'],
  settingsPath: '.clinerules/hooks/',
  timeoutUnit: 'n/a',

  generatePreEditHook(prsPath: string): Record<string, unknown> {
    return {
      scriptPath: '.clinerules/hooks/prs-pre-edit.sh',
      content: `#!/bin/bash\n# promptscript-generated:cline-pre-edit\n${prsPath} hook pre-edit`,
    };
  },

  generatePostEditHook(prsPath: string): Record<string, unknown> {
    return {
      scriptPath: '.clinerules/hooks/prs-post-edit.sh',
      content: `#!/bin/bash\n# promptscript-generated:cline-post-edit\n${prsPath} hook post-edit`,
    };
  },

  isOwnedScript(content: string, action: 'pre-edit' | 'post-edit'): boolean {
    return isPromptScriptClineHook(content, action);
  },

  mergeIntoSettings(existing: Record<string, unknown>, _prsPath: string): Record<string, unknown> {
    return existing;
  },

  removeFromSettings(existing: Record<string, unknown>): Record<string, unknown> {
    return existing;
  },
};
