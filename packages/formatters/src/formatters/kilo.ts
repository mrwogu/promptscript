import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Kilo Code format versions.
 */
export type KiloVersion = 'simple' | 'multifile' | 'full';

/**
 * Kilo Code formatter version information.
 */
export const KILO_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .kilocode/rules/project.md file',
    outputPath: '.kilocode/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.kilocode/rules/project.md + .kilocode/skills/<name>/SKILL.md',
    outputPath: '.kilocode/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .kilocode/skills/<name>/SKILL.md',
    outputPath: '.kilocode/rules/project.md',
  },
} as const;

/**
 * Formatter for Kilo Code instructions.
 *
 * Kilo Code uses `.kilocode/rules/project.md` as its main rules file
 * and `.kilocode/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - kilo
 * ```
 */
export class KiloFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'kilo',
      outputPath: '.kilocode/rules/project.md',
      description: 'Kilo Code rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.kilocode',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof KILO_VERSIONS {
    return KILO_VERSIONS;
  }
}
