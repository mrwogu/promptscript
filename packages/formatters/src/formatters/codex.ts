import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Codex format versions.
 */
export type CodexVersion = 'simple' | 'multifile' | 'full';

/**
 * Codex formatter version information.
 */
export const CODEX_VERSIONS = {
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
 * Formatter for OpenAI Codex instructions.
 *
 * Codex uses `AGENTS.md` as its main configuration file
 * and `.agents/skills/<name>/SKILL.md` for skills (shared directory).
 *
 * Supports three versions:
 * - **simple** (default): Single `AGENTS.md` file
 * - **multifile**: Single AGENTS.md file (reserved for future expansion)
 * - **full**: AGENTS.md + skills
 *
 * @remarks Shares `AGENTS.md` output path with `factory`, `amp`, and `droid`.
 * Do not target more than one in a single compile run without configuring
 * distinct `output` paths, or the last writer will overwrite the others.
 *
 * @example
 * ```yaml
 * targets:
 *   - codex  # uses simple mode
 *   - codex:
 *       version: full
 * ```
 */
export class CodexFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'codex',
      outputPath: 'AGENTS.md',
      description: 'Codex instructions (Markdown)',
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
  static getSupportedVersions(): typeof CODEX_VERSIONS {
    return CODEX_VERSIONS;
  }
}
