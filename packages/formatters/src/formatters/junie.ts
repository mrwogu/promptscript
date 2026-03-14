import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type JunieVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: JunieFormatter, VERSIONS: JUNIE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'junie',
    outputPath: '.junie/rules/project.md',
    description: 'Junie rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.junie',
  });
