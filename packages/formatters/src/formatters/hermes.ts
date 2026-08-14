import { createAgentsMdTarget } from './agents-md-target.js';

export type HermesVersion = 'simple' | 'multifile' | 'full';

const HERMES_UNSUPPORTED_BLOCKS = [
  'skills',
  'agents',
  'workflows',
  'prompts',
  'shortcuts',
  'guards',
  'local',
  'hooks',
  'mcpServers',
  'plugins',
] as const;

export const { Formatter: HermesFormatter, VERSIONS: HERMES_VERSIONS } = createAgentsMdTarget(
  'hermes',
  'Hermes Agent instructions (AGENTS.md)',
  { unsupportedBlocks: HERMES_UNSUPPORTED_BLOCKS }
);
