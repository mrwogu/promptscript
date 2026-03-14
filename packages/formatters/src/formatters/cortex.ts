import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type CortexVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: CortexFormatter, VERSIONS: CORTEX_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'cortex',
    outputPath: '.cortex/rules/project.md',
    description: 'Cortex Code rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.cortex',
  });
