import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Continue format versions.
 */
export type ContinueVersion = 'simple' | 'multifile' | 'full';

/**
 * Continue formatter version information.
 */
export const CONTINUE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .continue/rules/project.md file',
    outputPath: '.continue/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .continue/rules/project.md file (skills via full mode)',
    outputPath: '.continue/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.continue/rules/project.md + .continue/skills/<name>/SKILL.md',
    outputPath: '.continue/rules/project.md',
  },
} as const;

/**
 * Formatter for Continue (continue.dev) instructions.
 *
 * Continue uses `.continue/rules/project.md` as its main rules file
 * and `.continue/skills/<name>/SKILL.md` for skills.
 *
 * Supports three versions:
 * - **simple** (default): Single `.continue/rules/project.md` file
 * - **multifile**: Single rules file (reserved for future expansion)
 * - **full**: Rules + skills
 *
 * @example
 * ```yaml
 * targets:
 *   - continue  # uses simple mode
 *   - continue:
 *       version: multifile
 * ```
 */
export class ContinueFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'continue',
      outputPath: '.continue/rules/project.md',
      description: 'Continue rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.continue',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof CONTINUE_VERSIONS {
    return CONTINUE_VERSIONS;
  }
}
