import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type AugmentVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: AugmentFormatter, VERSIONS: AUGMENT_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'augment',
    outputPath: '.augment/rules/project.md',
    description: 'Augment rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.augment',
    hasSkills: false,
  });
