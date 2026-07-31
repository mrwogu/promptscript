import type { Program } from '@promptscript/core';
import {
  MarkdownInstructionFormatter,
  type MarkdownCommandConfig,
  type MarkdownVersion,
} from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';
import {
  extractHooks,
  generateGeminiHooks,
  getHookCompatibilityWarnings,
} from '../hook-adapters.js';

/**
 * Supported Gemini format versions.
 */
export type GeminiVersion = 'simple' | 'multifile' | 'full';

/**
 * Gemini formatter version information.
 */
export const GEMINI_VERSIONS = {
  simple: {
    name: 'simple',
    description: 'Single GEMINI.md file',
    outputPath: 'GEMINI.md',
  },
  multifile: {
    name: 'multifile',
    description: 'GEMINI.md + .gemini/commands/<name>.toml + .gemini/skills/<name>/skill.md',
    outputPath: 'GEMINI.md',
  },
  full: {
    name: 'full',
    description: 'Multifile (Gemini has no agent concept, equivalent to multifile)',
    outputPath: 'GEMINI.md',
  },
} as const;

/**
 * Formatter for Gemini CLI instructions.
 *
 * Gemini uses GEMINI.md as its main configuration file,
 * .gemini/commands/<name>.toml for commands (TOML format),
 * and .gemini/skills/<name>/skill.md for skills (lowercase).
 *
 * Gemini has no agent concept.
 *
 * Supports three versions:
 * - **simple**: Single `GEMINI.md` file
 * - **multifile**: GEMINI.md + commands (TOML) + skills
 * - **full** (default): Multifile + skills
 *
 * @example
 * ```yaml
 * targets:
 *   - gemini  # uses full mode (default)
 *   - gemini:
 *       version: simple
 * ```
 */
export class GeminiFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'gemini',
      outputPath: 'GEMINI.md',
      description: 'Gemini CLI instructions (Markdown + TOML)',
      defaultConvention: 'markdown',
      mainFileHeader: '# GEMINI.md',
      dotDir: '.gemini',
      skillFileName: 'skill.md',
      hasAgents: false,
      hasCommands: true,
      hasSkills: true,
      skillsInMultifile: true,
      mcpConfigPath: '.gemini/mcp_config.json',
    });
  }

  /**
   * Get supported versions for this formatter.
   */
  static getSupportedVersions(): typeof GEMINI_VERSIONS {
    return GEMINI_VERSIONS;
  }

  /**
   * Skill base path for auto-injected skills.
   * Returns `.gemini/skills` to match the path used by generateSkillFile()
   * (which derives from `this.config.dotDir`). This keeps the auto-injected
   * PromptScript skill consistent with user-defined @skills blocks and
   * avoids creating an unexpected `.agents/` directory.
   *
   * The `skillPath` target option (`agents` | `gemini` | `both`) is planned
   * but not yet implemented; when it lands, this method should respect it.
   */
  override getSkillBasePath(): string | null {
    return '.gemini/skills';
  }

  override format(ast: Program, options?: FormatOptions): FormatterOutput {
    const output = super.format(ast, options);
    return {
      ...output,
      managedOutputFiles: [
        ...new Set([...(output.managedOutputFiles ?? []), '.gemini/settings.json']),
      ],
    };
  }

  /**
   * Gemini treats full mode as multifile (no agents).
   */
  protected override formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    return this.formatMultifile(ast, options);
  }

  protected override formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    const output = super.formatMultifile(ast, options);
    const hooksBlock = ast.blocks.find((block) => block.name === 'hooks');
    if (!hooksBlock) {
      return {
        ...output,
        managedOutputFiles: [...(output.managedOutputFiles ?? []), '.gemini/settings.json'],
      };
    }

    const hooks = extractHooks(hooksBlock);
    const geminiHooks = generateGeminiHooks(hooks);
    const warnings = getHookCompatibilityWarnings(hooks, 'gemini').map((warning) => ({
      ...warning,
      location: hooksBlock.loc,
    }));
    const hooksFile =
      Object.keys(geminiHooks).length > 0
        ? [
            {
              path: '.gemini/settings.json',
              content: JSON.stringify({ hooks: geminiHooks }, null, 2) + '\n',
            },
          ]
        : [];

    return {
      ...output,
      ...(hooksFile.length > 0
        ? { additionalFiles: [...(output.additionalFiles ?? []), ...hooksFile] }
        : {}),
      ...(warnings.length > 0 ? { warnings: [...(output.warnings ?? []), ...warnings] } : {}),
      managedOutputFiles: [...(output.managedOutputFiles ?? []), '.gemini/settings.json'],
    };
  }

  /**
   * Gemini uses TOML format for command files instead of YAML frontmatter.
   */
  protected override generateCommandFile(config: MarkdownCommandConfig): FormatterOutput {
    const lines: string[] = [];

    // Escape double quotes in description for TOML
    const escapedDescription = config.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    lines.push(`description = "${escapedDescription}"`);

    if (config.content) {
      const dedentedContent = this.dedent(config.content);
      lines.push(`prompt = """\n${dedentedContent}\n"""`);
    }

    return {
      path: `.gemini/commands/${config.name}.toml`,
      content: lines.join('\n') + '\n',
    };
  }

  /**
   * Override version resolution: full maps to multifile for Gemini.
   */
  protected override resolveVersion(version?: string): MarkdownVersion {
    if (version === 'simple') return 'simple';
    if (version === 'multifile') return 'multifile';
    return 'full';
  }
}
