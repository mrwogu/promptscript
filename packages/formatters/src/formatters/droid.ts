import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type DroidVersion = 'simple' | 'multifile' | 'full';

export const DROID_VERSIONS = {
  simple: { name: 'simple', description: 'Single AGENTS.md file', outputPath: 'AGENTS.md' },
  multifile: {
    name: 'multifile',
    description: 'Single AGENTS.md file (skills via full mode)',
    outputPath: 'AGENTS.md',
  },
  full: {
    name: 'full',
    description: 'AGENTS.md + .factory/skills/<name>/SKILL.md (shared with Factory AI)',
    outputPath: 'AGENTS.md',
  },
} as const;

/**
 * Formatter for Droid instructions.
 *
 * Droid uses `AGENTS.md` as its main configuration file
 * and `.factory/skills/<name>/SKILL.md` for skills.
 * Shares the `.factory/` directory with Factory AI.
 *
 * @remarks Shares `AGENTS.md` output path with `factory`, `codex`, and `amp`.
 * Do not target more than one in a single compile run without configuring
 * distinct `output` paths, or the last writer will overwrite the others.
 *
 * @example
 * ```yaml
 * targets:
 *   - droid
 * ```
 */
export class DroidFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'droid',
      outputPath: 'AGENTS.md',
      description: 'Droid instructions (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# AGENTS.md',
      dotDir: '.factory',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof DROID_VERSIONS {
    return DROID_VERSIONS;
  }
}
