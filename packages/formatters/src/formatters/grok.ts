import type { Program } from '@promptscript/core';
import { BaseFormatter } from '../base-formatter.js';
import { ClaudeFormatter } from './claude.js';
import type { FormatOptions, FormatterOutput, FormatterVersionMap } from '../types.js';
import { findPluginsBlock, extractPlugins, serializePluginsToJson } from '../plugin-helpers.js';

/**
 * Supported Grok Build output format versions.
 */
export type GrokVersion = 'simple' | 'multifile' | 'full';

/**
 * Version configuration for the Grok Build formatter.
 */
export const GROK_VERSIONS: Readonly<
  Record<string, { name: string; description: string; outputPath: string }>
> = {
  simple: {
    name: 'simple',
    description: 'Root AGENTS.md only',
    outputPath: 'AGENTS.md',
  },
  multifile: {
    name: 'multifile',
    description: 'AGENTS.md, CLAUDE.md, Claude rules and commands',
    outputPath: 'AGENTS.md',
  },
  full: {
    name: 'full',
    description: 'AGENTS.md, CLAUDE.md, Claude rules, commands, skills, agents, and local memory',
    outputPath: 'AGENTS.md',
  },
} as const;

/**
 * Grok Build formatter.
 *
 * Generates primary `AGENTS.md` through shared Markdown instruction logic
 * and delegates compatible additional files to `ClaudeFormatter`.
 *
 * Version behavior:
 * - `simple`: Root AGENTS.md only
 * - `multifile`: AGENTS.md, CLAUDE.md, Claude rules and commands
 * - `full`: AGENTS.md, CLAUDE.md, Claude rules, commands, skills, agents, and local memory
 *
 * Grok is fully compatible with Claude Code with zero configuration, so
 * delegated files are byte-for-byte identical to Claude formatter output.
 */
export class GrokFormatter extends BaseFormatter {
  readonly name = 'grok';
  readonly outputPath = 'AGENTS.md';
  readonly description = 'Grok Build instructions (AGENTS.md + Claude delegation)';
  readonly defaultConvention = 'markdown';

  private claudeFormatter = new ClaudeFormatter();

  static getSupportedVersions(): FormatterVersionMap {
    return GROK_VERSIONS;
  }

  override getSkillBasePath(): string | null {
    // Grok delegates skill output to Claude in full mode only.
    // In simple and multifile modes, no skills are emitted.
    return '.claude/skills';
  }

  override getSkillFileName(): string | null {
    return 'SKILL.md';
  }

  override referencesMode(): 'directory' | 'inline' | 'none' {
    return 'directory';
  }

  format(ast: Program, options?: FormatOptions): FormatterOutput {
    const version = (options?.version ?? 'simple') as GrokVersion;

    if (version === 'simple') {
      return this.formatSimple(ast, options);
    }

    if (version === 'multifile') {
      return this.formatMultifile(ast, options);
    }

    return this.formatFull(ast, options);
  }

  private formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    // Delegate to Claude simple format but override the output path to AGENTS.md
    const claudeResult = this.claudeFormatter.format(ast, {
      ...options,
      version: 'simple',
      outputPath: 'AGENTS.md',
    });
    return claudeResult;
  }

  private formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    // Generate AGENTS.md as the primary file
    const agentsMd = this.claudeFormatter.format(ast, {
      ...options,
      version: 'simple',
      outputPath: 'AGENTS.md',
    });

    // Delegate CLAUDE.md and Claude rules/commands from Claude multifile
    const claudeMultifile = this.claudeFormatter.format(ast, {
      ...options,
      version: 'multifile',
    });

    // Collect additional files from Claude multifile, excluding CLAUDE.md
    // which is the main file in Claude multifile mode
    const additionalFiles: FormatterOutput[] = [];
    if (claudeMultifile.path !== 'AGENTS.md') {
      additionalFiles.push(claudeMultifile);
    }
    if (claudeMultifile.additionalFiles) {
      additionalFiles.push(...claudeMultifile.additionalFiles);
    }

    return {
      path: 'AGENTS.md',
      content: agentsMd.content,
      additionalFiles,
      managedOutputDirectories: claudeMultifile.managedOutputDirectories,
    };
  }

  private formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    // Generate AGENTS.md as the primary file
    const agentsMd = this.claudeFormatter.format(ast, {
      ...options,
      version: 'simple',
      outputPath: 'AGENTS.md',
    });

    // Delegate everything from Claude full mode
    const claudeFull = this.claudeFormatter.format(ast, {
      ...options,
      version: 'full',
    });

    // Collect all Claude output as additional files
    const additionalFiles: FormatterOutput[] = [];
    if (claudeFull.path !== 'AGENTS.md') {
      additionalFiles.push(claudeFull);
    }
    if (claudeFull.additionalFiles) {
      additionalFiles.push(...claudeFull.additionalFiles);
    }

    // Generate .grok/plugins.json from @plugins block
    const pluginsBlock = findPluginsBlock(ast);
    if (pluginsBlock) {
      const plugins = extractPlugins(pluginsBlock);
      if (plugins.length > 0) {
        additionalFiles.push({
          path: '.grok/plugins.json',
          content: serializePluginsToJson(plugins),
        });
      }
    }

    return {
      path: 'AGENTS.md',
      content: agentsMd.content,
      additionalFiles,
      managedOutputDirectories: claudeFull.managedOutputDirectories,
    };
  }
}
