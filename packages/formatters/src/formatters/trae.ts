import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Trae format versions.
 */
export type TraeVersion = 'simple' | 'multifile' | 'full';

/**
 * Trae formatter version information.
 */
export const TRAE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .trae/rules/project.md file',
    outputPath: '.trae/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.trae/rules/project.md + .trae/skills/<name>/SKILL.md',
    outputPath: '.trae/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .trae/skills/<name>/SKILL.md',
    outputPath: '.trae/rules/project.md',
  },
} as const;

/**
 * Formatter for Trae (by ByteDance) instructions.
 *
 * Trae uses `.trae/rules/project.md` as its main rules file
 * and `.trae/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - trae
 * ```
 */
export class TraeFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'trae',
      outputPath: '.trae/rules/project.md',
      description: 'Trae rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.trae',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof TRAE_VERSIONS {
    return TRAE_VERSIONS;
  }
}
