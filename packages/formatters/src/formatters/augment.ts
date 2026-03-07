import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Augment format versions.
 */
export type AugmentVersion = 'simple' | 'multifile' | 'full';

/**
 * Augment formatter version information.
 */
export const AUGMENT_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .augment/rules/project.md file',
    outputPath: '.augment/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.augment/rules/project.md + .augment/skills/<name>/SKILL.md',
    outputPath: '.augment/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .augment/skills/<name>/SKILL.md',
    outputPath: '.augment/rules/project.md',
  },
} as const;

/**
 * Formatter for Augment Code instructions.
 *
 * Augment uses `.augment/rules/project.md` as its main rules file
 * and `.augment/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - augment
 * ```
 */
export class AugmentFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'augment',
      outputPath: '.augment/rules/project.md',
      description: 'Augment rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.augment',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof AUGMENT_VERSIONS {
    return AUGMENT_VERSIONS;
  }
}
