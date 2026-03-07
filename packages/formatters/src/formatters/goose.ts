import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Goose format versions.
 */
export type GooseVersion = 'simple' | 'multifile' | 'full';

/**
 * Goose formatter version information.
 */
export const GOOSE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .goose/rules/project.md file',
    outputPath: '.goose/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.goose/rules/project.md + .goose/skills/<name>/SKILL.md',
    outputPath: '.goose/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .goose/skills/<name>/SKILL.md',
    outputPath: '.goose/rules/project.md',
  },
} as const;

/**
 * Formatter for Goose (by Block) instructions.
 *
 * Goose uses `.goose/rules/project.md` as its main rules file
 * and `.goose/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - goose
 * ```
 */
export class GooseFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'goose',
      outputPath: '.goose/rules/project.md',
      description: 'Goose rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.goose',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof GOOSE_VERSIONS {
    return GOOSE_VERSIONS;
  }
}
