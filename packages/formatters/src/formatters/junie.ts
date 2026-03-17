import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type JunieVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: JunieFormatter, VERSIONS: JUNIE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'junie',
    outputPath: '.junie/guidelines.md',
    description: 'Junie rules (Markdown)',
    mainFileHeader: '# Project Guidelines',
    dotDir: '.junie',
  });
