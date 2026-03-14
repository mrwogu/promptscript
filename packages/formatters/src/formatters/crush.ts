import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type CrushVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: CrushFormatter, VERSIONS: CRUSH_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'crush',
    outputPath: '.crush/rules/project.md',
    description: 'Crush rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.crush',
  });
