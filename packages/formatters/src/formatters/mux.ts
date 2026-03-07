import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type MuxVersion = 'simple' | 'multifile' | 'full';

export const MUX_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .mux/rules/project.md file',
    outputPath: '.mux/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.mux/rules/project.md + .mux/skills/<name>/SKILL.md',
    outputPath: '.mux/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .mux/skills/<name>/SKILL.md',
    outputPath: '.mux/rules/project.md',
  },
} as const;

/**
 * Formatter for Mux instructions.
 *
 * Mux uses `.mux/rules/project.md` as its main rules file
 * and `.mux/skills/<name>/SKILL.md` for skills.
 *
 * @example
 * ```yaml
 * targets:
 *   - mux
 * ```
 */
export class MuxFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'mux',
      outputPath: '.mux/rules/project.md',
      description: 'Mux rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.mux',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof MUX_VERSIONS {
    return MUX_VERSIONS;
  }
}
