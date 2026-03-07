import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported OpenCode format versions.
 */
export type OpenCodeVersion = 'simple' | 'multifile' | 'full';

/**
 * OpenCode formatter version information.
 */
export const OPENCODE_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single OPENCODE.md file',
    outputPath: 'OPENCODE.md',
  },
  multifile: {
    name: 'multifile',
    description: 'OPENCODE.md + .opencode/commands/<name>.md',
    outputPath: 'OPENCODE.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .opencode/skills/<name>/SKILL.md + .opencode/agents/<name>.md',
    outputPath: 'OPENCODE.md',
  },
} as const;

/**
 * Formatter for OpenCode instructions.
 *
 * OpenCode uses OPENCODE.md as its main configuration file,
 * .opencode/commands/<name>.md for commands,
 * .opencode/skills/<name>/SKILL.md for skills,
 * and .opencode/agents/<name>.md for agents.
 *
 * Supports three versions:
 * - **simple** (default): Single `OPENCODE.md` file
 * - **multifile**: OPENCODE.md + `.opencode/commands/<name>.md`
 * - **full**: Multifile + skills + agents
 *
 * @example
 * ```yaml
 * targets:
 *   - opencode  # uses simple mode
 *   - opencode:
 *       version: multifile
 *   - opencode:
 *       version: full
 * ```
 */
export class OpenCodeFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'opencode',
      outputPath: 'OPENCODE.md',
      description: 'OpenCode instructions (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# OPENCODE.md',
      dotDir: '.opencode',
      skillFileName: 'SKILL.md',
      hasAgents: true,
      hasCommands: true,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof OPENCODE_VERSIONS {
    return OPENCODE_VERSIONS;
  }
}
