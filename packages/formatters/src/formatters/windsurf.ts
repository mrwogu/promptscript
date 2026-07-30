import type { Program } from '@promptscript/core';
import type { SimpleFormatterVersions } from '../create-simple-formatter.js';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';
import {
  extractHooks,
  generateWindsurfHooks,
  getHookCompatibilityWarnings,
} from '../hook-adapters.js';

export type WindsurfVersion = 'simple' | 'multifile' | 'full';

const FRONTMATTER = '---\ntrigger: always_on\n---\n\n';

function prependFrontmatter(output: FormatterOutput): FormatterOutput {
  return { ...output, content: FRONTMATTER + output.content };
}

export const WINDSURF_VERSIONS: SimpleFormatterVersions = {
  simple: {
    name: 'simple',
    description: 'Single .windsurf/rules/project.md file',
    outputPath: '.windsurf/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .windsurf/rules/project.md file (skills via full mode)',
    outputPath: '.windsurf/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.windsurf/rules/project.md + .windsurf/skills/<name>/SKILL.md',
    outputPath: '.windsurf/rules/project.md',
  },
} as const;

export class WindsurfFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'windsurf',
      outputPath: '.windsurf/rules/project.md',
      description: 'Windsurf rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.windsurf',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
      mcpConfigPath: '.windsurf/mcp_config.json',
    });
  }

  static getSupportedVersions(): SimpleFormatterVersions {
    return WINDSURF_VERSIONS;
  }

  protected override formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    const output = prependFrontmatter(super.formatSimple(ast, options));
    return {
      ...output,
      managedOutputFiles: [
        ...new Set([...(output.managedOutputFiles ?? []), '.windsurf/hooks.json']),
      ],
    };
  }

  protected override formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    return this.appendHooks(ast, prependFrontmatter(super.formatMultifile(ast, options)));
  }

  protected override formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    return this.appendHooks(ast, prependFrontmatter(super.formatFull(ast, options)));
  }

  private appendHooks(ast: Program, output: FormatterOutput): FormatterOutput {
    const hooksBlock = ast.blocks.find((block) => block.name === 'hooks');
    if (!hooksBlock) {
      return {
        ...output,
        managedOutputFiles: [...(output.managedOutputFiles ?? []), '.windsurf/hooks.json'],
      };
    }

    const hooks = extractHooks(hooksBlock);
    const windsurfHooks = generateWindsurfHooks(hooks);
    const warnings = getHookCompatibilityWarnings(hooks, 'windsurf').map((warning) => ({
      ...warning,
      location: hooksBlock.loc,
    }));
    const hooksFile =
      Object.keys(windsurfHooks).length > 0
        ? [
            {
              path: '.windsurf/hooks.json',
              content: JSON.stringify({ hooks: windsurfHooks }, null, 2) + '\n',
            },
          ]
        : [];

    return {
      ...output,
      ...(hooksFile.length > 0
        ? { additionalFiles: [...(output.additionalFiles ?? []), ...hooksFile] }
        : {}),
      ...(warnings.length > 0 ? { warnings: [...(output.warnings ?? []), ...warnings] } : {}),
      managedOutputFiles: [...(output.managedOutputFiles ?? []), '.windsurf/hooks.json'],
    };
  }
}
