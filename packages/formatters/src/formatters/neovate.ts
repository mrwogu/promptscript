import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type NeovateVersion = 'simple' | 'multifile' | 'full';

export const NEOVATE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .neovate/rules/project.md file',
    outputPath: '.neovate/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .neovate/rules/project.md file (skills via full mode)',
    outputPath: '.neovate/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.neovate/rules/project.md + .neovate/skills/<name>/SKILL.md',
    outputPath: '.neovate/rules/project.md',
  },
} as const;

/**
 * Formatter for Neovate instructions.
 *
 * Neovate uses `.neovate/rules/project.md` as its main rules file
 * and `.neovate/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - neovate
 * ```
 */
export class NeovateFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'neovate',
      outputPath: '.neovate/rules/project.md',
      description: 'Neovate rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.neovate',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof NEOVATE_VERSIONS {
    return NEOVATE_VERSIONS;
  }
}
