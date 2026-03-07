import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type ZencoderVersion = 'simple' | 'multifile' | 'full';

export const ZENCODER_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .zencoder/rules/project.md file',
    outputPath: '.zencoder/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.zencoder/rules/project.md + .zencoder/skills/<name>/SKILL.md',
    outputPath: '.zencoder/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .zencoder/skills/<name>/SKILL.md',
    outputPath: '.zencoder/rules/project.md',
  },
} as const;

/**
 * Formatter for Zencoder instructions.
 *
 * Zencoder uses `.zencoder/rules/project.md` as its main rules file
 * and `.zencoder/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - zencoder
 * ```
 */
export class ZencoderFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'zencoder',
      outputPath: '.zencoder/rules/project.md',
      description: 'Zencoder rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.zencoder',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof ZENCODER_VERSIONS {
    return ZENCODER_VERSIONS;
  }
}
