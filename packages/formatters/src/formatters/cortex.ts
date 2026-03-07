import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Cortex Code format versions.
 */
export type CortexVersion = 'simple' | 'multifile' | 'full';

/**
 * Cortex Code formatter version information.
 */
export const CORTEX_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .cortex/rules/project.md file',
    outputPath: '.cortex/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.cortex/rules/project.md + .cortex/skills/<name>/SKILL.md',
    outputPath: '.cortex/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .cortex/skills/<name>/SKILL.md',
    outputPath: '.cortex/rules/project.md',
  },
} as const;

/**
 * Formatter for Cortex Code (by Snowflake) instructions.
 *
 * Cortex Code uses `.cortex/rules/project.md` as its main rules file
 * and `.cortex/skills/<name>/SKILL.md` for skills.
 * Global skills are stored in `~/.snowflake/cortex/skills/`.
 *
 * @example
 * ```yaml
 * targets:
 *   - cortex
 * ```
 */
export class CortexFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'cortex',
      outputPath: '.cortex/rules/project.md',
      description: 'Cortex Code rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.cortex',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof CORTEX_VERSIONS {
    return CORTEX_VERSIONS;
  }
}
