import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type RooVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: RooFormatter, VERSIONS: ROO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'roo',
  outputPath: '.roorules',
  description: 'Roo Code rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.roo',
});
