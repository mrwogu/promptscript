import type { Program } from '@promptscript/core';
import type { SimpleFormatterVersions } from '../create-simple-formatter.js';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

export type KiroVersion = 'simple' | 'multifile' | 'full';

const FRONTMATTER = '---\ninclusion: always\n---\n\n';

function prependFrontmatter(output: FormatterOutput): FormatterOutput {
  return { ...output, content: FRONTMATTER + output.content };
}

export const KIRO_VERSIONS: SimpleFormatterVersions = {
  simple: {
    name: 'simple',
    description: 'Single .kiro/steering/project.md file',
    outputPath: '.kiro/steering/project.md',
  },
  multifile: {
    name: 'multifile',
    description: 'Single .kiro/steering/project.md file (skills via full mode)',
    outputPath: '.kiro/steering/project.md',
  },
  full: {
    name: 'full',
    description: '.kiro/steering/project.md + .kiro/skills/<name>/SKILL.md',
    outputPath: '.kiro/steering/project.md',
  },
} as const;

export class KiroFormatter extends MarkdownInstructionFormatter {
  constructor() {
    super({
      name: 'kiro',
      outputPath: '.kiro/steering/project.md',
      description: 'Kiro steering file (Markdown)',
      defaultConvention: 'markdown',
      mainFileHeader: '# Project Rules',
      dotDir: '.kiro',
      skillFileName: 'SKILL.md',
      hasAgents: false,
      hasCommands: false,
      hasSkills: true,
    });
  }

  static getSupportedVersions(): SimpleFormatterVersions {
    return KIRO_VERSIONS;
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
