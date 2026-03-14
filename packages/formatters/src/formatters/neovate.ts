import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type NeovateVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: NeovateFormatter, VERSIONS: NEOVATE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'neovate',
    outputPath: '.neovate/rules/project.md',
    description: 'Neovate rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.neovate',
  });
