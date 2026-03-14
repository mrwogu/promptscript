import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type MuxVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: MuxFormatter, VERSIONS: MUX_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'mux',
  outputPath: '.mux/rules/project.md',
  description: 'Mux rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.mux',
});
