import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type QoderVersion = 'simple' | 'multifile' | 'full';

export const QODER_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .qoder/rules/project.md file',
    outputPath: '.qoder/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.qoder/rules/project.md + .qoder/skills/<name>/SKILL.md',
    outputPath: '.qoder/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .qoder/skills/<name>/SKILL.md',
    outputPath: '.qoder/rules/project.md',
  },
} as const;

/**
 * Formatter for Qoder instructions.
 *
 * Qoder uses `.qoder/rules/project.md` as its main rules file
 * and `.qoder/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - qoder
 * ```
 */
export class QoderFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'qoder',
      outputPath: '.qoder/rules/project.md',
      description: 'Qoder rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.qoder',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof QODER_VERSIONS {
    return QODER_VERSIONS;
  }
}
