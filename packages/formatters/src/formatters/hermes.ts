import { createAgentsMdTarget } from './agents-md-target.js';
import { TARGET_CAPABILITIES } from '@promptscript/core';

export type HermesVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: HermesFormatter, VERSIONS: HERMES_VERSIONS } = createAgentsMdTarget(
  'hermes',
  'Hermes Agent instructions (AGENTS.md)',
  { unsupportedBlocks: TARGET_CAPABILITIES.hermes.unsupportedBlocks }
);
