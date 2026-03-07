import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type PochiVersion = 'simple' | 'multifile' | 'full';

export const POCHI_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .pochi/rules/project.md file',
    outputPath: '.pochi/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.pochi/rules/project.md + .pochi/skills/<name>/SKILL.md',
    outputPath: '.pochi/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .pochi/skills/<name>/SKILL.md',
    outputPath: '.pochi/rules/project.md',
  },
} as const;

/**
 * Formatter for Pochi instructions.
 *
 * Pochi uses `.pochi/rules/project.md` as its main rules file
 * and `.pochi/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - pochi
 * ```
 */
export class PochiFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'pochi',
      outputPath: '.pochi/rules/project.md',
      description: 'Pochi rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.pochi',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof POCHI_VERSIONS {
    return POCHI_VERSIONS;
  }
}
