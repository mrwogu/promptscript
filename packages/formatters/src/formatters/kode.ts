import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type KodeVersion = 'simple' | 'multifile' | 'full';

export const KODE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .kode/rules/project.md file',
    outputPath: '.kode/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.kode/rules/project.md + .kode/skills/<name>/SKILL.md',
    outputPath: '.kode/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .kode/skills/<name>/SKILL.md',
    outputPath: '.kode/rules/project.md',
  },
} as const;

/**
 * Formatter for Kode instructions.
 *
 * Kode uses `.kode/rules/project.md` as its main rules file
 * and `.kode/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - kode
 * ```
 */
export class KodeFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'kode',
      outputPath: '.kode/rules/project.md',
      description: 'Kode rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.kode',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof KODE_VERSIONS {
    return KODE_VERSIONS;
  }
}
