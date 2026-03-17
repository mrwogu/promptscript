import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type ClineVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: ClineFormatter, VERSIONS: CLINE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'cline',
    outputPath: '.clinerules',
    description: 'Cline rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.clinerules',
    hasSkills: false,
  });
