import { createAgentsMdTarget } from './agents-md-target.js';

export type AmazonQVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: AmazonQFormatter, VERSIONS: AMAZON_Q_VERSIONS } = createAgentsMdTarget(
  'amazon-q',
  'Amazon Q Developer CLI instructions (AGENTS.md)'
);
