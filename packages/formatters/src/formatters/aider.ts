import { createAgentsMdTarget } from './agents-md-target.js';

export type AiderVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: AiderFormatter, VERSIONS: AIDER_VERSIONS } = createAgentsMdTarget(
  'aider',
  'Aider conventions (AGENTS.md)'
);
