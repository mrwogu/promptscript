import type { ToolHookConfig } from './types.js';
import { isPrsHookEntry } from './claude.js';

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

export const factoryConfig: ToolHookConfig = {
  name: 'factory',
  detectPaths: ['.factory'],
  settingsPath: '.factory/settings.json',
  timeoutUnit: 'seconds',

  generatePreEditHook(prsPath: string): Record<string, unknown> {
    return {
      matcher: 'Create|Edit',
      hooks: [
        {
          type: 'command',
          command: `${prsPath} hook pre-edit`,
          timeout: 5,
          statusMessage: 'PromptScript: checking generated files...',
        },
      ],
    };
  },

  generatePostEditHook(prsPath: string): Record<string, unknown> {
    return {
      matcher: 'Create|Edit',
      hooks: [
        {
          type: 'command',
          command: `${prsPath} hook post-edit`,
          timeout: 15,
          statusMessage: 'PromptScript: compiling...',
        },
      ],
    };
  },

  mergeIntoSettings(existing: Record<string, unknown>, prsPath: string): Record<string, unknown> {
    const hooksSection = getHooksSection(existing);
    const preToolUse = getHookArray(hooksSection, 'PreToolUse');
    const postToolUse = getHookArray(hooksSection, 'PostToolUse');

    const newPreToolUse = preToolUse.some(isPrsHookEntry)
      ? preToolUse
      : [...preToolUse, this.generatePreEditHook(prsPath)];

    const newPostToolUse = postToolUse.some(isPrsHookEntry)
      ? postToolUse
      : [...postToolUse, this.generatePostEditHook(prsPath)];

    return {
      ...existing,
      hooks: {
        ...hooksSection,
        PreToolUse: newPreToolUse,
        PostToolUse: newPostToolUse,
      },
    };
  },

  removeFromSettings(existing: Record<string, unknown>): Record<string, unknown> {
    const hooksSection = getHooksSection(existing);
    const preToolUse = getHookArray(hooksSection, 'PreToolUse');
    const postToolUse = getHookArray(hooksSection, 'PostToolUse');

    return {
      ...existing,
      hooks: {
        ...hooksSection,
        PreToolUse: preToolUse.filter((e) => !isPrsHookEntry(e)),
        PostToolUse: postToolUse.filter((e) => !isPrsHookEntry(e)),
      },
    };
  },
};
