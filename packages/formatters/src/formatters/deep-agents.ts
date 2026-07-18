import { createAgentsMdTarget } from '../formatters/agents-md-target.js';

export type DeepAgentsVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: DeepAgentsFormatter, VERSIONS: DEEP_AGENTS_VERSIONS } =
  createAgentsMdTarget('deep-agents', 'Deep Agents Code memory (AGENTS.md)');
