import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type PiVersion = 'simple' | 'multifile' | 'full';

export const PI_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .pi/rules/project.md file',
    outputPath: '.pi/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.pi/rules/project.md + .pi/skills/<name>/SKILL.md',
    outputPath: '.pi/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .pi/skills/<name>/SKILL.md',
    outputPath: '.pi/rules/project.md',
  },
} as const;

/**
 * Formatter for Pi instructions.
 *
 * Pi uses `.pi/rules/project.md` as its main rules file
 * and `.pi/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - pi
 * ```
 */
export class PiFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'pi',
      outputPath: '.pi/rules/project.md',
      description: 'Pi rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.pi',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof PI_VERSIONS {
    return PI_VERSIONS;
  }
}
