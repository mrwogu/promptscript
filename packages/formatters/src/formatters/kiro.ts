import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type KiroVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: KiroFormatter, VERSIONS: KIRO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'kiro',
  outputPath: '.kiro/rules/project.md',
  description: 'Kiro CLI rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.kiro',
});
