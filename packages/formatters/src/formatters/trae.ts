import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type TraeVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: TraeFormatter, VERSIONS: TRAE_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'trae',
  outputPath: '.trae/rules/project.md',
  description: 'Trae rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.trae',
});
