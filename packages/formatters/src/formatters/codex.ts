import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type CodexVersion = 'simple' | 'multifile' | 'full';

// dotDir: '.agents' is a PromptScript convention for skill output paths.
// Codex does not prescribe a standard location for skill directories;
// teams reference skill paths explicitly. The '.agents/skills/<name>/SKILL.md'
// layout works with Codex but is not required by the OpenAI documentation.
export const { Formatter: CodexFormatter, VERSIONS: CODEX_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'codex',
    outputPath: 'AGENTS.md',
    description: 'Codex instructions (Markdown)',
    mainFileHeader: '',
    dotDir: '.agents',
  });
