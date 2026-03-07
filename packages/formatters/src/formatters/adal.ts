import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type AdalVersion = 'simple' | 'multifile' | 'full';

export const ADAL_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .adal/rules/project.md file',
    outputPath: '.adal/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.adal/rules/project.md + .adal/skills/<name>/SKILL.md',
    outputPath: '.adal/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .adal/skills/<name>/SKILL.md',
    outputPath: '.adal/rules/project.md',
  },
} as const;

/**
 * Formatter for AdaL instructions.
 *
 * AdaL uses `.adal/rules/project.md` as its main rules file
 * and `.adal/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - adal
 * ```
 */
export class AdalFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'adal',
      outputPath: '.adal/rules/project.md',
      description: 'AdaL rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.adal',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof ADAL_VERSIONS {
    return ADAL_VERSIONS;
  }
}
