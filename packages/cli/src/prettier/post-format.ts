import { resolve } from 'path';
import type { FormatterOutput } from '@promptscript/compiler';
import type { Logger } from '@promptscript/core';

/**
 * Markdown-family extensions that should be post-processed through Prettier.
 * Limited intentionally — Prettier's other parsers (e.g. CSS, JSON) are not
 * exercised by any current formatter target.
 */
const MARKDOWN_RE = /\.(md|mdx|markdown)$/i;

/**
 * Run Prettier (using the project's own configuration) over every markdown
 * output produced by the formatters, mutating the outputs map in place.
 *
 * Why: PromptScript formatters emit best-effort markdown, but they can't
 * perfectly anticipate every Prettier rule (table alignment, prose wrapping,
 * list-continuation indentation, trailing whitespace). Running Prettier as a
 * post-process guarantees every generated `.md` file already conforms to the
 * project's `.prettierrc` and so survives `nx format:check` / pre-commit hooks.
 *
 * The project's `.prettierignore` is intentionally NOT consulted here — these
 * files are owned by PromptScript and should always be normalised, even if a
 * user ignores them from manual prettier runs.
 *
 * @param outputs - Outputs from the compiler (mutated in place)
 * @param projectRoot - Project root used both for resolving Prettier configs
 *   and to give each file a realistic absolute path
 * @param logger - Logger used for verbose / debug diagnostics
 */
export async function postFormatWithPrettier(
  outputs: Map<string, FormatterOutput>,
  projectRoot: string,
  logger: Logger
): Promise<void> {
  let prettier: typeof import('prettier');
  try {
    prettier = await import('prettier');
  } catch {
    logger.verbose('Prettier not available; skipping markdown post-format.');
    return;
  }

  const queue: FormatterOutput[] = [];
  for (const output of outputs.values()) {
    collectOutputs(output, queue);
  }

  for (const output of queue) {
    if (!MARKDOWN_RE.test(output.path)) continue;
    const absPath = resolve(projectRoot, output.path);

    let config: import('prettier').Options | null = null;
    try {
      config = await prettier.resolveConfig(absPath);
    } catch (err) {
      logger.verbose(
        `Could not resolve Prettier config for ${output.path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    try {
      output.content = await prettier.format(output.content, {
        ...(config ?? {}),
        filepath: absPath,
        parser: 'markdown',
      });
    } catch (err) {
      logger.verbose(
        `Prettier rejected ${output.path}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

/**
 * Flatten the nested `additionalFiles` structure so every output is visited
 * exactly once.
 */
function collectOutputs(output: FormatterOutput, into: FormatterOutput[]): void {
  into.push(output);
  if (output.additionalFiles) {
    for (const child of output.additionalFiles) {
      collectOutputs(child, into);
    }
  }
}
