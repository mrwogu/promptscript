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
