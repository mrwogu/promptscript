import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Windsurf format versions.
 */
export type WindsurfVersion = 'simple' | 'multifile' | 'full';

/**
 * Windsurf formatter version information.
 */
export const WINDSURF_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .windsurf/rules/project.md file',
    outputPath: '.windsurf/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.windsurf/rules/project.md + .windsurf/skills/<name>/SKILL.md',
    outputPath: '.windsurf/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .windsurf/skills/<name>/SKILL.md',
    outputPath: '.windsurf/rules/project.md',
  },
} as const;

/**
 * Formatter for Windsurf (by Codeium) instructions.
 *
 * Windsurf uses `.windsurf/rules/project.md` as its main rules file
 * and `.windsurf/skills/<name>/SKILL.md` for skills.
 *
 * Supports three versions:
 * - **simple** (default): Single `.windsurf/rules/project.md` file
 * - **multifile**: Rules + skills
 * - **full**: Equivalent to multifile (Windsurf has no agent concept)
 *
 * @example
 * ```yaml
 * targets:
 *   - windsurf  # uses simple mode
 *   - windsurf:
 *       version: multifile
 * ```
 */
export class WindsurfFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'windsurf',
      outputPath: '.windsurf/rules/project.md',
      description: 'Windsurf rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.windsurf',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof WINDSURF_VERSIONS {
    return WINDSURF_VERSIONS;
  }
}
