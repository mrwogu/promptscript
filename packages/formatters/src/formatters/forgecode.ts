import { createAgentsMdTarget } from '../formatters/agents-md-target.js';

export type ForgecodeVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: ForgecodeFormatter, VERSIONS: FORGECODE_VERSIONS } = createAgentsMdTarget(
  'forgecode',
  'ForgeCode instructions (AGENTS.md)'
);
