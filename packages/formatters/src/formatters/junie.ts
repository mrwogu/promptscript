import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Junie format versions.
 */
export type JunieVersion = 'simple' | 'multifile' | 'full';

/**
 * Junie formatter version information.
 */
export const JUNIE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .junie/rules/project.md file',
    outputPath: '.junie/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.junie/rules/project.md + .junie/skills/<name>/SKILL.md',
    outputPath: '.junie/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .junie/skills/<name>/SKILL.md',
    outputPath: '.junie/rules/project.md',
  },
} as const;

/**
 * Formatter for Junie (by JetBrains) instructions.
 *
 * Junie uses `.junie/rules/project.md` as its main rules file
 * and `.junie/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - junie
 * ```
 */
export class JunieFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'junie',
      outputPath: '.junie/rules/project.md',
      description: 'Junie rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.junie',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof JUNIE_VERSIONS {
    return JUNIE_VERSIONS;
  }
}
