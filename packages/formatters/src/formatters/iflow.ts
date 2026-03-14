import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type IflowVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: IflowFormatter, VERSIONS: IFLOW_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'iflow',
    outputPath: '.iflow/rules/project.md',
    description: 'iFlow CLI rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.iflow',
  });
