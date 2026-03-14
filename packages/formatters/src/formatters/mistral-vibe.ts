import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type MistralVibeVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: MistralVibeFormatter, VERSIONS: MISTRAL_VIBE_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'mistral-vibe',
    outputPath: '.vibe/rules/project.md',
    description: 'Mistral Vibe rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.vibe',
  });
