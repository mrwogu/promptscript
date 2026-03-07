import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type OpenHandsVersion = 'simple' | 'multifile' | 'full';

export const OPENHANDS_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .openhands/rules/project.md file',
    outputPath: '.openhands/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.openhands/rules/project.md + .openhands/skills/<name>/SKILL.md',
    outputPath: '.openhands/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .openhands/skills/<name>/SKILL.md',
    outputPath: '.openhands/rules/project.md',
  },
} as const;

/**
 * Formatter for OpenHands instructions.
 *
 * OpenHands uses `.openhands/rules/project.md` as its main rules file
 * and `.openhands/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - openhands
 * ```
 */
export class OpenHandsFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'openhands',
      outputPath: '.openhands/rules/project.md',
      description: 'OpenHands rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.openhands',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof OPENHANDS_VERSIONS {
    return OPENHANDS_VERSIONS;
  }
}
