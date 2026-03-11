import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Roo Code format versions.
 */
export type RooVersion = 'simple' | 'multifile' | 'full';

/**
 * Roo Code formatter version information.
 */
export const ROO_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .roorules file',
    outputPath: '.roorules',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .roorules file (skills via full mode)',
    outputPath: '.roorules',
  },
  full: {
    name: 'full',
    description: '.roorules + .roo/skills/<name>/SKILL.md',
    outputPath: '.roorules',
  },
} as const;

/**
 * Formatter for Roo Code instructions.
 *
 * Roo Code uses `.roorules` as its main configuration file
 * and `.roo/skills/<name>/SKILL.md` for skills.
 *
 * Supports three versions:
 * - **simple** (default): Single `.roorules` file
 * - **multifile**: Single rules file (reserved for future expansion)
 * - **full**: Rules + skills
 *
 * @example
 * ```yaml
 * targets:
 *   - roo  # uses simple mode
 *   - roo:
 *       version: multifile
 * ```
 */
export class RooFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'roo',
      outputPath: '.roorules',
      description: 'Roo Code rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.roo',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof ROO_VERSIONS {
    return ROO_VERSIONS;
  }
}
