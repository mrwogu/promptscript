import type { Program } from '@promptscript/core';
import type { SimpleFormatterVersions } from '../create-simple-formatter.js';
import { MarkdownInstructionFormatter } from '../markdown-instruction-formatter.js';
import type { FormatOptions, FormatterOutput } from '../types.js';

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
    });
  }

  static getSupportedVersions(): SimpleFormatterVersions {
    return WINDSURF_VERSIONS;
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
