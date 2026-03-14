import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type KodeVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: KodeFormatter, VERSIONS: KODE_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'kode',
  outputPath: '.kode/rules/project.md',
  description: 'Kode rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.kode',
});
