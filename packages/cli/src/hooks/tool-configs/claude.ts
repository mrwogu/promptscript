import type { ToolHookConfig } from './types.js';

/**
 * Returns true if the given hook array entry contains a `prs hook` command,
 * indicating it was installed by PromptScript.
 */
export function isPrsHookEntry(entry: unknown): boolean {
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

export const claudeConfig: ToolHookConfig = {
  name: 'claude',
  detectPaths: ['.claude'],
  settingsPath: '.claude/settings.json',
  timeoutUnit: 'seconds',

  generatePreEditHook(prsPath: string): Record<string, unknown> {
    return {
      matcher: 'Edit|Write',
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
      matcher: 'Edit|Write',
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

    const preAlreadyInstalled = preToolUse.some(isPrsHookEntry);
    const postAlreadyInstalled = postToolUse.some(isPrsHookEntry);

    const newPreToolUse = preAlreadyInstalled
      ? preToolUse
      : [...preToolUse, this.generatePreEditHook(prsPath)];

    const newPostToolUse = postAlreadyInstalled
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
