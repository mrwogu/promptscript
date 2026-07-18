import { createAgentsMdTarget } from '../formatters/agents-md-target.js';

export type KimiVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: KimiFormatter, VERSIONS: KIMI_VERSIONS } = createAgentsMdTarget(
  'kimi',
  'Kimi CLI instructions (AGENTS.md)'
);
