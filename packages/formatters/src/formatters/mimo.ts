import { createAgentsMdTarget } from '../formatters/agents-md-target.js';

export type MimoVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: MimoFormatter, VERSIONS: MIMO_VERSIONS } = createAgentsMdTarget(
  'mimo',
  'MiMo Code instructions (AGENTS.md)'
);
