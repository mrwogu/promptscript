import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type RooVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: RooFormatter, VERSIONS: ROO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'roo',
  outputPath: '.roorules',
  description: 'Roo Code rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.roo',
  hasSkills: false, // Roo Code has no skills directory under .roo/
  hasCommands: false, // Roo Code has no slash-command files
  hasAgents: false, // Roo Code has no .roo/agents/ directory
});
