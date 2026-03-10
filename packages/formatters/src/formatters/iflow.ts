import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type IflowVersion = 'simple' | 'multifile' | 'full';

export const IFLOW_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .iflow/rules/project.md file',
    outputPath: '.iflow/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .iflow/rules/project.md file (skills via full mode)',
    outputPath: '.iflow/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.iflow/rules/project.md + .iflow/skills/<name>/SKILL.md',
    outputPath: '.iflow/rules/project.md',
  },
} as const;

/**
 * Formatter for iFlow CLI instructions.
 *
 * iFlow uses `.iflow/rules/project.md` as its main rules file
 * and `.iflow/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - iflow
 * ```
 */
export class IflowFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'iflow',
      outputPath: '.iflow/rules/project.md',
      description: 'iFlow CLI rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.iflow',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof IFLOW_VERSIONS {
    return IFLOW_VERSIONS;
  }
}
