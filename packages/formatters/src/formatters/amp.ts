import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Amp format versions.
 */
export type AmpVersion = 'simple' | 'multifile' | 'full';

/**
 * Amp formatter version information.
 */
export const AMP_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single AGENTS.md file',
    outputPath: 'AGENTS.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single AGENTS.md file (skills via full mode)',
    outputPath: 'AGENTS.md',
  },
  full: {
    name: 'full',
    description: 'AGENTS.md + .agents/skills/<name>/SKILL.md',
    outputPath: 'AGENTS.md',
  },
} as const;

/**
 * Formatter for Amp (by Sourcegraph) instructions.
 *
 * Amp uses `AGENTS.md` as its main configuration file
 * and `.agents/skills/<name>/SKILL.md` for skills (shared directory).
 *
 * @remarks Shares `AGENTS.md` output path with `factory`, `codex`, and `droid`.
 * Do not target more than one in a single compile run without configuring
 * distinct `output` paths, or the last writer will overwrite the others.
 *
 * @example
 * ```yaml
 * targets:
 *   - amp
 * ```
 */
export class AmpFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'amp',
      outputPath: 'AGENTS.md',
      description: 'Amp instructions (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# AGENTS.md',
      dotDir: '.agents',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof AMP_VERSIONS {
    return AMP_VERSIONS;
  }
}
