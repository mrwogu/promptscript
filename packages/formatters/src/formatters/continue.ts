import type { Program } from '@promptscript/core';
import type { SimpleFormatterVersions } from '../create-simple-formatter.js';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

export type ContinueVersion = 'simple' | 'multifile' | 'full';

const FRONTMATTER = '---\nname: Project Rules\nalwaysApply: true\n---\n\n';

function prependFrontmatter(output: FormatterOutput): FormatterOutput {
  return { ...output, content: FRONTMATTER + output.content };
}

export const CONTINUE_VERSIONS: SimpleFormatterVersions = {
  simple: {
    name: 'simple',
    description: 'Single .continue/rules/project.md file',
    outputPath: '.continue/rules/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .continue/rules/project.md file (skills via full mode)',
    outputPath: '.continue/rules/project.md',
  },
  full: {
    name: 'full',
    description: '.continue/rules/project.md + .continue/skills/<name>/SKILL.md',
    outputPath: '.continue/rules/project.md',
  },
} as const;

export class ContinueFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'continue',
      outputPath: '.continue/rules/project.md',
      description: 'Continue rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.continue',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: false,
    });
  }

  static getSupportedVersions(): SimpleFormatterVersions {
    return CONTINUE_VERSIONS;
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
