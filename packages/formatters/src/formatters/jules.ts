import { createAgentsMdTarget } from './agents-md-target.js';

export type JulesVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: JulesFormatter, VERSIONS: JULES_VERSIONS } = createAgentsMdTarget(
  'jules',
  'Jules instructions (AGENTS.md)'
);
