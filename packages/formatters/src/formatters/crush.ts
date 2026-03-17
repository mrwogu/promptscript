import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type CrushVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: CrushFormatter, VERSIONS: CRUSH_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'crush',
    outputPath: 'AGENTS.md',
    description: 'Crush instructions (Markdown)',
    mainFileHeader: '# AGENTS.md',
    dotDir: '.crush',
  });
