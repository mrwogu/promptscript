import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Cline format versions.
 */
export type ClineVersion = 'simple' | 'multifile' | 'full';

/**
 * Cline formatter version information.
 */
export const CLINE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .clinerules file',
    outputPath: '.clinerules',
  },
  multifile: {
    name: 'multifile',
    description: '.clinerules + .agents/skills/<name>/SKILL.md',
    outputPath: '.clinerules',
  },
  full: {
    name: 'full',
    description: 'Multifile + .agents/skills/<name>/SKILL.md',
    outputPath: '.clinerules',
  },
} as const;

/**
 * Formatter for Cline instructions.
 *
 * Cline uses `.clinerules` as its main configuration file
 * and `.agents/skills/<name>/SKILL.md` for skills (shared directory).
 *
 * Supports three versions:
 * - **simple** (default): Single `.clinerules` file
 * - **multifile**: Rules + skills
 * - **full**: Equivalent to multifile (Cline has no agent concept)
 *
 * @example
 * ```yaml
 * targets:
 *   - cline  # uses simple mode
 *   - cline:
 *       version: multifile
 * ```
 */
export class ClineFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'cline',
      outputPath: '.clinerules',
      description: 'Cline rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.agents',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof CLINE_VERSIONS {
    return CLINE_VERSIONS;
  }
}
