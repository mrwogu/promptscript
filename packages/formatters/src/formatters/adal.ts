import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type AdalVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: AdalFormatter, VERSIONS: ADAL_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'adal',
  outputPath: '.adal/rules/project.md',
  description: 'AdaL rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.adal',
});
