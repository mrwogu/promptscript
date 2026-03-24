import type { ToolHookConfig } from './types.js';

function getHooksSection(existing: Record<string, unknown>): Record<string, unknown> {
  const hooks = existing['hooks'];
  if (typeof hooks === 'object' && hooks !== null && !Array.isArray(hooks)) {
    return hooks as Record<string, unknown>;
  }
  return {};
}

function getHookArray(hooksSection: Record<string, unknown>, key: string): unknown[] {
  const arr = hooksSection[key];
  return Array.isArray(arr) ? arr : [];
}

function isPrsGeminiHookEntry(entry: unknown): boolean {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  const obj = entry as Record<string, unknown>;
  const hooks = obj['hooks'];
  if (!Array.isArray(hooks)) {
    return false;
  }
  return hooks.some((h: unknown) => {
    if (typeof h !== 'object' || h === null) return false;
    const hook = h as Record<string, unknown>;
    return typeof hook['command'] === 'string' && hook['command'].includes('prs hook');
  });
}

export const geminiConfig: ToolHookConfig = {
  name: 'gemini',
  detectPaths: ['.gemini'],
  settingsPath: '.gemini/settings.json',
  timeoutUnit: 'milliseconds',

  generatePreEditHook(prsPath: string): Record<string, unknown> {
    return {
      matcher: 'write_.*|edit_.*',
      hooks: [
        {
          type: 'command',
          command: `${prsPath} hook pre-edit`,
          timeout: 5000,
        },
      ],
    };
  },

  generatePostEditHook(prsPath: string): Record<string, unknown> {
    return {
      matcher: 'write_.*|edit_.*',
      hooks: [
        {
          type: 'command',
          command: `${prsPath} hook post-edit`,
          timeout: 15000,
        },
      ],
    };
  },

  mergeIntoSettings(existing: Record<string, unknown>, prsPath: string): Record<string, unknown> {
    const hooksSection = getHooksSection(existing);
    const beforeTool = getHookArray(hooksSection, 'BeforeTool');
    const afterTool = getHookArray(hooksSection, 'AfterTool');

    const newBeforeTool = beforeTool.some(isPrsGeminiHookEntry)
      ? beforeTool
      : [...beforeTool, this.generatePreEditHook(prsPath)];

    const newAfterTool = afterTool.some(isPrsGeminiHookEntry)
      ? afterTool
      : [...afterTool, this.generatePostEditHook(prsPath)];

    return {
      ...existing,
      hooks: {
        ...hooksSection,
        BeforeTool: newBeforeTool,
        AfterTool: newAfterTool,
      },
    };
  },

  removeFromSettings(existing: Record<string, unknown>): Record<string, unknown> {
    const hooksSection = getHooksSection(existing);
    const beforeTool = getHookArray(hooksSection, 'BeforeTool');
    const afterTool = getHookArray(hooksSection, 'AfterTool');

    return {
      ...existing,
      hooks: {
        ...hooksSection,
        BeforeTool: beforeTool.filter((e) => !isPrsGeminiHookEntry(e)),
        AfterTool: afterTool.filter((e) => !isPrsGeminiHookEntry(e)),
      },
    };
  },
};
