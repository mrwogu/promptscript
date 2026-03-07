import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type CodeBuddyVersion = 'simple' | 'multifile' | 'full';

export const CODEBUDDY_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .codebuddy/rules/project.md file',
    outputPath: '.codebuddy/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.codebuddy/rules/project.md + .codebuddy/skills/<name>/SKILL.md',
    outputPath: '.codebuddy/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .codebuddy/skills/<name>/SKILL.md',
    outputPath: '.codebuddy/rules/project.md',
  },
} as const;

/**
 * Formatter for CodeBuddy instructions.
 *
 * CodeBuddy uses `.codebuddy/rules/project.md` as its main rules file
 * and `.codebuddy/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - codebuddy
 * ```
 */
export class CodeBuddyFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'codebuddy',
      outputPath: '.codebuddy/rules/project.md',
      description: 'CodeBuddy rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.codebuddy',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof CODEBUDDY_VERSIONS {
    return CODEBUDDY_VERSIONS;
  }
}
