import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type CodexVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: CodexFormatter, VERSIONS: CODEX_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'codex',
    outputPath: 'AGENTS.md',
    description: 'Codex instructions (Markdown)',
    mainFileHeader: '# AGENTS.md',
    dotDir: '.agents',
  });
