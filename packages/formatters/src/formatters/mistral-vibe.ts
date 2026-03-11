import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type MistralVibeVersion = 'simple' | 'multifile' | 'full';

export const MISTRAL_VIBE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .vibe/rules/project.md file',
    outputPath: '.vibe/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .vibe/rules/project.md file (skills via full mode)',
    outputPath: '.vibe/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.vibe/rules/project.md + .vibe/skills/<name>/SKILL.md',
    outputPath: '.vibe/rules/project.md',
  },
} as const;

/**
 * Formatter for Mistral Vibe instructions.
 *
 * Mistral Vibe uses `.vibe/rules/project.md` as its main rules file
 * and `.vibe/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - mistral-vibe
 * ```
 */
export class MistralVibeFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'mistral-vibe',
      outputPath: '.vibe/rules/project.md',
      description: 'Mistral Vibe rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.vibe',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof MISTRAL_VIBE_VERSIONS {
    return MISTRAL_VIBE_VERSIONS;
  }
}
