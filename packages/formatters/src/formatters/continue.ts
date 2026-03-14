import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type ContinueVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: ContinueFormatter, VERSIONS: CONTINUE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'continue',
    outputPath: '.continue/rules/project.md',
    description: 'Continue rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.continue',
  });
