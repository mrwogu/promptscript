import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

export type OpenClawVersion = 'simple' | 'multifile' | 'full';

export const OPENCLAW_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single INSTRUCTIONS.md file',
    outputPath: 'INSTRUCTIONS.md',
  },
  multifile: {
    name: 'multifile',
    description: 'INSTRUCTIONS.md + skills/<name>/SKILL.md',
    outputPath: 'INSTRUCTIONS.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + skills/<name>/SKILL.md',
    outputPath: 'INSTRUCTIONS.md',
  },
} as const;

/**
 * Formatter for OpenClaw instructions.
 *
 * OpenClaw uses `INSTRUCTIONS.md` as its main configuration file
 * and `skills/<name>/SKILL.md` for skills (no dot prefix).
 *
 * @example
 * ```yaml
 * targets:
 *   - openclaw
 * ```
 */
export class OpenClawFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'openclaw',
      outputPath: 'INSTRUCTIONS.md',
      description: 'OpenClaw instructions (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# INSTRUCTIONS.md',
      dotDir: 'skills',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): typeof OPENCLAW_VERSIONS {
    return OPENCLAW_VERSIONS;
  }
}
