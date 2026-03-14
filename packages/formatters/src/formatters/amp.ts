import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type AmpVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: AmpFormatter, VERSIONS: AMP_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'amp',
  outputPath: 'AGENTS.md',
  description: 'Amp instructions (Markdown)',
  mainFileHeader: '# AGENTS.md',
  dotDir: '.agents',
});
