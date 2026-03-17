import type { Program } from '@promptscript/core';
import type { SimpleFormatterVersions } from '../create-simple-formatter.js';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

export type ZencoderVersion = 'simple' | 'multifile' | 'full';

const FRONTMATTER = '---\nalwaysApply: true\ndescription: Project Rules\n---\n\n';

function prependFrontmatter(output: FormatterOutput): FormatterOutput {
  return { ...output, content: FRONTMATTER + output.content };
}

export const ZENCODER_VERSIONS: SimpleFormatterVersions = {
  simple: {
    name: 'simple',
    description: 'Single .zencoder/rules/project.md file',
    outputPath: '.zencoder/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .zencoder/rules/project.md file (skills via full mode)',
    outputPath: '.zencoder/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.zencoder/rules/project.md + .zencoder/skills/<name>/SKILL.md',
    outputPath: '.zencoder/rules/project.md',
  },
} as const;

export class ZencoderFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'zencoder',
      outputPath: '.zencoder/rules/project.md',
      description: 'Zencoder rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.zencoder',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): SimpleFormatterVersions {
    return ZENCODER_VERSIONS;
  }

  protected override formatSimple(ast: Program, options?: FormatOptions): FormatterOutput {
    return prependFrontmatter(super.formatSimple(ast, options));
  }

  protected override formatMultifile(ast: Program, options?: FormatOptions): FormatterOutput {
    return prependFrontmatter(super.formatMultifile(ast, options));
  }

  protected override formatFull(ast: Program, options?: FormatOptions): FormatterOutput {
    return prependFrontmatter(super.formatFull(ast, options));
  }
}
