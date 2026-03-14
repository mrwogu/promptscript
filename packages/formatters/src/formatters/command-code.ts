import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type CommandCodeVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: CommandCodeFormatter, VERSIONS: COMMAND_CODE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'command-code',
    outputPath: '.commandcode/rules/project.md',
    description: 'Command Code rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.commandcode',
  });
