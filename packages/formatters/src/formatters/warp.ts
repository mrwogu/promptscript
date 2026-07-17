import { createAgentsMdTarget } from './agents-md-target.js';

export type WarpVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: WarpFormatter, VERSIONS: WARP_VERSIONS } = createAgentsMdTarget(
  'warp',
  'Warp project rules (AGENTS.md)'
);
