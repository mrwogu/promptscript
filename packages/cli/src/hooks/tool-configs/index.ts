export { claudeConfig } from './claude.js';
export { factoryConfig } from './factory.js';
export { cursorConfig } from './cursor.js';
export { windsurfConfig } from './windsurf.js';
export { clineConfig } from './cline.js';
export { copilotConfig } from './copilot.js';
export { geminiConfig } from './gemini.js';
export type { ToolHookConfig } from './types.js';

import type { ToolHookConfig } from './types.js';
import { claudeConfig } from './claude.js';
import { factoryConfig } from './factory.js';
import { cursorConfig } from './cursor.js';
import { windsurfConfig } from './windsurf.js';
import { clineConfig } from './cline.js';
import { copilotConfig } from './copilot.js';
import { geminiConfig } from './gemini.js';
import { HOOK_CAPABILITIES, type HookCapability, type KnownTarget } from '@promptscript/core';

const TOOL_TARGETS: Readonly<Record<string, KnownTarget>> = {
  claude: 'claude',
  factory: 'factory',
  cursor: 'cursor',
  windsurf: 'windsurf',
  cline: 'cline',
  copilot: 'github',
  gemini: 'gemini',
};

export const ALL_TOOL_CONFIGS: ToolHookConfig[] = [
  claudeConfig,
  factoryConfig,
  cursorConfig,
  windsurfConfig,
  clineConfig,
  copilotConfig,
  geminiConfig,
];

export function getToolConfig(name: string): ToolHookConfig | undefined {
  return ALL_TOOL_CONFIGS.find((c) => c.name === name);
}

export function getToolHookCapability(name: string): HookCapability | undefined {
  const target = TOOL_TARGETS[name];
  return target ? HOOK_CAPABILITIES[target] : undefined;
}
