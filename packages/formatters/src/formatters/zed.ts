import { createAgentsMdTarget } from './agents-md-target.js';

export type ZedVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: ZedFormatter, VERSIONS: ZED_VERSIONS } = createAgentsMdTarget(
  'zed',
  'Zed instructions (AGENTS.md)',
  { mcpConfigPath: '.zed/settings.json' }
);
