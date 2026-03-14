import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type CodeBuddyVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: CodeBuddyFormatter, VERSIONS: CODEBUDDY_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'codebuddy',
    outputPath: '.codebuddy/rules/project.md',
    description: 'CodeBuddy rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.codebuddy',
  });
