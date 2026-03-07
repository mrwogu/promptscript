import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type McpjamVersion = 'simple' | 'multifile' | 'full';

export const MCPJAM_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .mcpjam/rules/project.md file',
    outputPath: '.mcpjam/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.mcpjam/rules/project.md + .mcpjam/skills/<name>/SKILL.md',
    outputPath: '.mcpjam/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .mcpjam/skills/<name>/SKILL.md',
    outputPath: '.mcpjam/rules/project.md',
  },
} as const;

/**
 * Formatter for MCPJam instructions.
 *
 * MCPJam uses `.mcpjam/rules/project.md` as its main rules file
 * and `.mcpjam/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - mcpjam
 * ```
 */
export class McpjamFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'mcpjam',
      outputPath: '.mcpjam/rules/project.md',
      description: 'MCPJam rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.mcpjam',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof MCPJAM_VERSIONS {
    return MCPJAM_VERSIONS;
  }
}
