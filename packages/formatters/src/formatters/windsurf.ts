import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type WindsurfVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: WindsurfFormatter, VERSIONS: WINDSURF_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'windsurf',
    outputPath: '.windsurf/rules/project.md',
    description: 'Windsurf rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.windsurf',
  });
