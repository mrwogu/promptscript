import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type OpenCodeVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: OpenCodeFormatter, VERSIONS: OPENCODE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'opencode',
    outputPath: 'OPENCODE.md',
    description: 'OpenCode instructions (Markdown)',
    mainFileHeader: '# OPENCODE.md',
    dotDir: '.opencode',
    hasAgents: true,
    hasCommands: true,
  });
