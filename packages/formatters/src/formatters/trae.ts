import type { Program } from '@promptscript/core';
import type { SimpleFormatterVersions } from '../create-simple-formatter.js';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

export type TraeVersion = 'simple' | 'multifile' | 'full';

const FRONTMATTER = '---\nalwaysApply: true\n---\n\n';

function prependFrontmatter(output: FormatterOutput): FormatterOutput {
  return { ...output, content: FRONTMATTER + output.content };
}

export const TRAE_VERSIONS: SimpleFormatterVersions = {
  simple: {
    name: 'simple',
    description: 'Single .trae/rules/project_rules.md file',
    outputPath: '.trae/rules/project_rules.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .trae/rules/project_rules.md file (skills via full mode)',
    outputPath: '.trae/rules/project_rules.md',
  },
  full: {
    name: 'full',
    description: '.trae/rules/project_rules.md + .trae/skills/<name>/SKILL.md',
    outputPath: '.trae/rules/project_rules.md',
  },
} as const;

export class TraeFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'trae',
      outputPath: '.trae/rules/project_rules.md',
      description: 'Trae rules (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.trae',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): SimpleFormatterVersions {
    return TRAE_VERSIONS;
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
