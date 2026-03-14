import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type OpenHandsVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: OpenHandsFormatter, VERSIONS: OPENHANDS_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'openhands',
    outputPath: '.openhands/rules/project.md',
    description: 'OpenHands rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.openhands',
  });
