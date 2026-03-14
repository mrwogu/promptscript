import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type QoderVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: QoderFormatter, VERSIONS: QODER_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'qoder',
    outputPath: '.qoder/rules/project.md',
    description: 'Qoder rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.qoder',
  });
