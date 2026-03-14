import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type ZencoderVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: ZencoderFormatter, VERSIONS: ZENCODER_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'zencoder',
    outputPath: '.zencoder/rules/project.md',
    description: 'Zencoder rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.zencoder',
  });
