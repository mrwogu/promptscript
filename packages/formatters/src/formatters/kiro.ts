import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';

/**
 * Supported Kiro CLI format versions.
 */
export type KiroVersion = 'simple' | 'multifile' | 'full';

/**
 * Kiro CLI formatter version information.
 */
export const KIRO_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single .kiro/rules/project.md file',
    outputPath: '.kiro/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: '.kiro/rules/project.md + .kiro/skills/<name>/SKILL.md',
    outputPath: '.kiro/rules/project.md',
  },
  full: {
    name: 'full',
    description: 'Multifile + .kiro/skills/<name>/SKILL.md',
    outputPath: '.kiro/rules/project.md',
  },
} as const;

/**
 * Formatter for Kiro CLI (by Amazon/AWS) instructions.
 *
 * Kiro uses `.kiro/rules/project.md` as its main rules file
 * and `.kiro/skills/<name>/SKILL.md` for skills.
 *
 * Note: Kiro CLI users need to manually add skills to their custom agent's
 * resources in `.kiro/agents/<agent>.json`.
 *
 * @example
 * ```yaml
 * targets:
 *   - kiro
 * ```
 */
export class KiroFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'kiro',
      outputPath: '.kiro/rules/project.md',
      description: 'Kiro CLI rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.kiro',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof KIRO_VERSIONS {
    return KIRO_VERSIONS;
  }
}
