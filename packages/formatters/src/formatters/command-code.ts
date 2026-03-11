import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Command Code format versions.
 */
export type CommandCodeVersion = 'simple' | 'multifile' | 'full';

export const COMMAND_CODE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .commandcode/rules/project.md file',
    outputPath: '.commandcode/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .commandcode/rules/project.md file (skills via full mode)',
    outputPath: '.commandcode/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.commandcode/rules/project.md + .commandcode/skills/<name>/SKILL.md',
    outputPath: '.commandcode/rules/project.md',
  },
} as const;

/**
 * Formatter for Command Code instructions.
 *
 * Command Code uses `.commandcode/rules/project.md` as its main rules file
 * and `.commandcode/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - command-code
 * ```
 */
export class CommandCodeFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'command-code',
      outputPath: '.commandcode/rules/project.md',
      description: 'Command Code rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.commandcode',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof COMMAND_CODE_VERSIONS {
    return COMMAND_CODE_VERSIONS;
  }
}
