import type { Program } from '@promptscript/core';
import type { SimpleFormatterVersions } from '../create-simple-formatter.js';
import {
  extractHooks,
  generateOpenCodePlugin,
  getHookCompatibilityWarnings,
  OPENCODE_PLUGIN_PATH,
} from '../hook-adapters.js';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

export type OpenCodeVersion = 'simple' | 'multifile' | 'full';

/**
 * OpenCode formatter version information.
 *
 * Descriptions mirror what the formatter actually emits: skill and agent
 * files are full-mode-only, command files appear from multifile mode on, and
 * the PromptScript lifecycle plugin is emitted in multifile and full modes.
 */
export const OPENCODE_VERSIONS: SimpleFormatterVersions = {
  simple: {
    name: 'simple',
    description: 'Single OPENCODE.md file',
    outputPath: 'OPENCODE.md',
  },
  multifile: {
    name: 'multifile',
    description: 'OPENCODE.md + .opencode/commands/<name>.md (skills via full mode)',
    outputPath: 'OPENCODE.md',
  },
  full: {
    name: 'full',
    description:
      'Multifile + .opencode/skills/<name>/SKILL.md + .opencode/commands/<name>.md + .opencode/agents/<name>.md',
    outputPath: 'OPENCODE.md',
  },
} as const;

/**
 * Formatter for OpenCode instructions.
 *
 * OpenCode reads OPENCODE.md as its main instruction file, with native
 * commands (`.opencode/commands/`), skills (`.opencode/skills/`), and agents
 * (`.opencode/agents/`).
 *
 * `@hooks` compile to a project-local plugin at
 * `.opencode/plugins/promptscript.ts` in multifile and full modes. Only
 * `pre-tool-use` and `post-tool-use` map to the OpenCode plugin API
 * (`tool.execute.before` / `tool.execute.after`); other events are omitted
 * with `PS4002` compatibility warnings.
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

  static getSupportedVersions(): SimpleFormatterVersions {
    return OPENCODE_VERSIONS;
  }

  protected override formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    const output = super.formatSimple(ast, options);
    return {
      ...output,
      managedOutputFiles: [
        ...new Set([...(output.managedOutputFiles ?? []), OPENCODE_PLUGIN_PATH]),
      ],
    };
  }

  protected override formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    return this.appendHookPlugin(ast, super.formatMultifile(ast, options));
  }

  protected override formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    return this.appendHookPlugin(ast, super.formatFull(ast, options));
  }

  /**
   * Attach the generated OpenCode plugin and its compatibility warnings.
   *
   * The plugin path is always registered as managed output so recompiles and
   * version downgrades remove only PromptScript-owned files; user plugins in
   * the same directory are never touched.
   */
  private appendHookPlugin(ast: Program, output: FormatterOutput): FormatterOutput {
    const managedFiles = [...new Set([...(output.managedOutputFiles ?? []), OPENCODE_PLUGIN_PATH])];
    const hooksBlock = ast.blocks.find((block) => block.name === 'hooks');
    if (!hooksBlock) {
      return { ...output, managedOutputFiles: managedFiles };
    }

    const hooks = extractHooks(hooksBlock);
    const plugin = generateOpenCodePlugin(hooks);
    const warnings = getHookCompatibilityWarnings(hooks, 'opencode').map((warning) => ({
      ...warning,
      location: hooksBlock.loc,
    }));

    return {
      ...output,
      ...(plugin !== null
        ? {
            additionalFiles: [
              ...(output.additionalFiles ?? []),
              { path: OPENCODE_PLUGIN_PATH, content: plugin },
            ],
          }
        : {}),
      ...(warnings.length > 0 ? { warnings: [...(output.warnings ?? []), ...warnings] } : {}),
      managedOutputFiles: managedFiles,
      managedOutputDirectories: [
        ...new Set([...(output.managedOutputDirectories ?? []), '.opencode/plugins']),
      ],
    };
  }
}
