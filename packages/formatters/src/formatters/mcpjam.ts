import { createSimpleMarkdownFormatter } from '../create-simple-formatter.js';

export type McpjamVersion = 'simple' | 'multifile' | 'full';

export const { Formatter: McpjamFormatter, VERSIONS: MCPJAM_VERSIONS } =
  createSimpleMarkdownFormatter({
    name: 'mcpjam',
    outputPath: '.mcpjam/rules/project.md',
    description: 'MCPJam rules (Markdown)',
    mainFileHeader: '# Project Rules',
    dotDir: '.mcpjam',
  });
