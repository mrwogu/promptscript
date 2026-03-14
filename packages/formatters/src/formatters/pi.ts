import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type PiVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: PiFormatter, VERSIONS: PI_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'pi',
  outputPath: '.pi/rules/project.md',
  description: 'Pi rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.pi',
});
