import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type QwenCodeVersion = 'simple' | 'multifile' | 'full';

export const QWEN_CODE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .qwen/rules/project.md file',
    outputPath: '.qwen/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.qwen/rules/project.md + .qwen/skills/<name>/SKILL.md',
    outputPath: '.qwen/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .qwen/skills/<name>/SKILL.md',
    outputPath: '.qwen/rules/project.md',
  },
} as const;

/**
 * Formatter for Qwen Code instructions.
 *
 * Qwen Code uses `.qwen/rules/project.md` as its main rules file
 * and `.qwen/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - qwen-code
 * ```
 */
export class QwenCodeFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'qwen-code',
      outputPath: '.qwen/rules/project.md',
      description: 'Qwen Code rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.qwen',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof QWEN_CODE_VERSIONS {
    return QWEN_CODE_VERSIONS;
  }
}
