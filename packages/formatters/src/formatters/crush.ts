import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Crush format versions.
 */
export type CrushVersion = 'simple' | 'multifile' | 'full';

export const CRUSH_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .crush/rules/project.md file',
    outputPath: '.crush/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.crush/rules/project.md + .crush/skills/<name>/SKILL.md',
    outputPath: '.crush/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .crush/skills/<name>/SKILL.md',
    outputPath: '.crush/rules/project.md',
  },
} as const;

/**
 * Formatter for Crush instructions.
 *
 * Crush uses `.crush/rules/project.md` as its main rules file
 * and `.crush/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - crush
 * ```
 */
export class CrushFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'crush',
      outputPath: '.crush/rules/project.md',
      description: 'Crush rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.crush',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof CRUSH_VERSIONS {
    return CRUSH_VERSIONS;
  }
}
