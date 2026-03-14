import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type PochiVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: PochiFormatter, VERSIONS: POCHI_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'pochi',
    outputPath: '.pochi/rules/project.md',
    description: 'Pochi rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.pochi',
  });
