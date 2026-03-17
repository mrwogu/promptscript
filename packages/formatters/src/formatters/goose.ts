import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type GooseVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: GooseFormatter, VERSIONS: GOOSE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'goose',
    outputPath: '.goosehints',
    description: 'Goose rules (Markdown)',
    mainFileHeader: '# .goosehints',
    dotDir: '.goose',
  });
