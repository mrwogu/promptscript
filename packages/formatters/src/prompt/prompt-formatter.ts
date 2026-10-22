import type { Program } from '@promptscript/core';
import type { Formatter, FormatOptions, FormatterOutput, FormatterWarning } from '../types.js';
import {
  PromptFormatError,
  buildPromptBundles,
  compositionOf,
  type BuiltPrompts,
} from './bundle.js';

/** Placement of the files of one prompt target. */
export interface PromptLayout {
  /** Primary file, for example `prompts/index.json` */
  primary: string;
  /** Directory of the primary file. Bundles sit next to it. */
  directory: string;
}

/**
 * Directory of a primary output path.
 * A target owns the directory of its primary file, so a path without one is refused: cleanup
 * would otherwise treat the project root as owned.
 */
function layoutOf(target: string, primary: string): PromptLayout {
  const path = primary.replaceAll('\\', '/');
  const slash = path.lastIndexOf('/');
  if (slash <= 0) {
    throw new PromptFormatError(
      `The ${target} target writes a directory of files next to its primary file, so its output must name one, ` +
        `for example "prompts/index.json". Got "${primary}".`
    );
  }
  return { primary: path, directory: path.slice(0, slash) };
}

/** What a prompt target does with the built prompts of a program. */
export interface PromptRender {
  /** Content of the primary file, or undefined when there is nothing to write */
  primary?: string;
  /** Other files, relative to the directory of the primary file */
  files: Array<{ name: string; content: string }>;
  /** Diagnostics for prompts the target skipped */
  warnings?: FormatterWarning[];
}

/**
 * Shared shell of the `bundle` and `prompt-text` targets.
 *
 * It reads the prompts once, refuses syntax below 1.6.0, and writes nothing for a program
 * without prompts. Subclasses decide the file contents.
 */
export abstract class PromptFormatter implements Formatter {
  readonly defaultConvention = 'markdown';

  protected constructor(
    readonly name: string,
    readonly outputPath: string,
    readonly description: string
  ) {}

  protected abstract render(built: BuiltPrompts): PromptRender;

  format(ast: Program, options?: FormatOptions): FormatterOutput {
    const layout = layoutOf(this.name, options?.outputPath ?? this.outputPath);
    const built = buildPromptBundles(ast, options, this.name);
    const rendered = this.render(built);
    const composition = built.prompts.flatMap((prompt) => compositionOf(prompt) ?? []);
    if (rendered.primary === undefined) {
      return {
        path: layout.primary,
        content: '',
        omit: true,
        ...(rendered.warnings?.length ? { warnings: rendered.warnings } : {}),
      };
    }
    return {
      path: layout.primary,
      content: rendered.primary,
      additionalFiles: rendered.files.map((file) => ({
        path: `${layout.directory}/${file.name}`,
        content: file.content,
      })),
      managedOutputDirectories: [layout.directory],
      ...(composition.length > 0 ? { composition } : {}),
      ...(rendered.warnings?.length ? { warnings: rendered.warnings } : {}),
    };
  }

  getSkillBasePath(): string | null {
    return null;
  }

  getSkillFileName(): string | null {
    return null;
  }

  referencesMode(): 'none' {
    return 'none';
  }
}
