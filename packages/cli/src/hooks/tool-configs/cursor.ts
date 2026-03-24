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

function isPrsCursorHookEntry(entry: unknown): boolean {
  if (typeof entry !== 'object' || entry === null) {
    return false;
  }
  const obj = entry as Record<string, unknown>;
  const command = obj['command'];
  if (!Array.isArray(command)) {
    return false;
  }
  return command.some((part: unknown) => typeof part === 'string' && part.includes('prs hook'));
}

export const cursorConfig: ToolHookConfig = {
  name: 'cursor',
  detectPaths: ['.cursor'],
  settingsPath: '.cursor/hooks.json',
  timeoutUnit: 'milliseconds',

  generatePreEditHook(prsPath: string): Record<string, unknown> {
    return {
      hooks: {
        beforeFileEdit: [
          {
            command: ['bash', '-c', `${prsPath} hook pre-edit`],
            timeout_ms: 5000,
          },
        ],
      },
    };
  },

  generatePostEditHook(prsPath: string): Record<string, unknown> {
    return {
      hooks: {
        afterFileEdit: [
          {
            command: ['bash', '-c', `${prsPath} hook post-edit`],
            timeout_ms: 15000,
          },
        ],
      },
    };
  },

  mergeIntoSettings(existing: Record<string, unknown>, prsPath: string): Record<string, unknown> {
    const hooksSection = getHooksSection(existing);
    const beforeFileEdit = getHookArray(hooksSection, 'beforeFileEdit');
    const afterFileEdit = getHookArray(hooksSection, 'afterFileEdit');

    const newBeforeFileEdit = beforeFileEdit.some(isPrsCursorHookEntry)
      ? beforeFileEdit
      : [
          ...beforeFileEdit,
          {
            command: ['bash', '-c', `${prsPath} hook pre-edit`],
            timeout_ms: 5000,
          },
        ];

    const newAfterFileEdit = afterFileEdit.some(isPrsCursorHookEntry)
      ? afterFileEdit
      : [
          ...afterFileEdit,
          {
            command: ['bash', '-c', `${prsPath} hook post-edit`],
            timeout_ms: 15000,
          },
        ];

    return {
      ...existing,
      hooks: {
        ...hooksSection,
        beforeFileEdit: newBeforeFileEdit,
        afterFileEdit: newAfterFileEdit,
      },
    };
  },

  removeFromSettings(existing: Record<string, unknown>): Record<string, unknown> {
    const hooksSection = getHooksSection(existing);
    const beforeFileEdit = getHookArray(hooksSection, 'beforeFileEdit');
    const afterFileEdit = getHookArray(hooksSection, 'afterFileEdit');

    return {
      ...existing,
      hooks: {
        ...hooksSection,
        beforeFileEdit: beforeFileEdit.filter((e) => !isPrsCursorHookEntry(e)),
        afterFileEdit: afterFileEdit.filter((e) => !isPrsCursorHookEntry(e)),
      },
    };
  },
};
