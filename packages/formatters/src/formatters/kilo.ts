import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type KiloVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: KiloFormatter, VERSIONS: KILO_VERSIONS } = createSimpleMarkdownFormatter({
  name: 'kilo',
  outputPath: '.kilocode/rules/project.md',
  description: 'Kilo Code rules (Markdown)',
  mainFileHeader: '# Project Rules',
  dotDir: '.kilocode',
});
