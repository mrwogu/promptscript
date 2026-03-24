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

export const windsurfConfig: ToolHookConfig = {
  name: 'windsurf',
  detectPaths: ['.windsurf'],
  settingsPath: '.windsurf/hooks.json',
  timeoutUnit: 'milliseconds',

  generatePreEditHook(prsPath: string): Record<string, unknown> {
    return {
      matcher: 'Edit|Write',
      hooks: [
        {
          type: 'command',
          command: `${prsPath} hook pre-edit`,
          timeout: 5000,
          statusMessage: 'PromptScript: checking generated files...',
        },
      ],
    };
  },

  generatePostEditHook(prsPath: string): Record<string, unknown> {
    return {
      matcher: 'Edit|Write',
      hooks: [
        {
          type: 'command',
          command: `${prsPath} hook post-edit`,
          timeout: 15000,
          statusMessage: 'PromptScript: compiling...',
        },
      ],
    };
  },

  mergeIntoSettings(existing: Record<string, unknown>, prsPath: string): Record<string, unknown> {
    const hooksSection = getHooksSection(existing);
    const preWriteCode = getHookArray(hooksSection, 'pre_write_code');
    const postWriteCode = getHookArray(hooksSection, 'post_write_code');

    const newPreWriteCode = preWriteCode.some(isPrsHookEntry)
      ? preWriteCode
      : [...preWriteCode, this.generatePreEditHook(prsPath)];

    const newPostWriteCode = postWriteCode.some(isPrsHookEntry)
      ? postWriteCode
      : [...postWriteCode, this.generatePostEditHook(prsPath)];

    return {
      ...existing,
      hooks: {
        ...hooksSection,
        pre_write_code: newPreWriteCode,
        post_write_code: newPostWriteCode,
      },
    };
  },

  removeFromSettings(existing: Record<string, unknown>): Record<string, unknown> {
    const hooksSection = getHooksSection(existing);
    const preWriteCode = getHookArray(hooksSection, 'pre_write_code');
    const postWriteCode = getHookArray(hooksSection, 'post_write_code');

    return {
      ...existing,
      hooks: {
        ...hooksSection,
        pre_write_code: preWriteCode.filter((e) => !isPrsHookEntry(e)),
        post_write_code: postWriteCode.filter((e) => !isPrsHookEntry(e)),
      },
    };
  },
};
