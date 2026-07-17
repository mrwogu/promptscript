import { createAgentsMdTarget } from './agents-md-target.js';

export type DevinVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: DevinFormatter, VERSIONS: DEVIN_VERSIONS } = createAgentsMdTarget(
  'devin',
  'Devin CLI rules (AGENTS.md)'
);
