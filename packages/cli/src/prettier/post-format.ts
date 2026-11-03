import { resolve } from 'node:path';
import type { FormatterOutput } from '@promptscript/compiler';
import { collectSkillResourcePaths, isPromptTarget, type Logger } from '@promptscript/core';

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
 * user ignores them from manual prettier runs. Skill resource files
 * (templates, references, scripts) are the exception: they are copied as they
 * are, because scripts may read them byte for byte.
 *
 * @param outputs - Outputs from the compiler (mutated in place)
 * @param projectRoot - Project root used both for resolving Prettier configs
 *   and to give each file a realistic absolute path
 * @param logger - Logger used for verbose / debug diagnostics
 * @returns Post-format warning messages
 */
export async function postFormatWithPrettier(
  outputs: Map<string, FormatterOutput>,
  projectRoot: string,
  logger: Logger
): Promise<string[]> {
  const warnings: string[] = [];
  let prettier: typeof import('prettier');
  try {
    prettier = await import('prettier');
  } catch {
    const warning = 'Prettier not available; skipping markdown post-format.';
    warnings.push(warning);
    logger.verbose(warning);
    return warnings;
  }

  const queue: FormatterOutput[] = [];
  for (const output of outputs.values()) {
    collectOutputs(output, queue);
  }

  const skillResources = collectSkillResourcePaths(queue.map((output) => output.path));

  const formattable = queue.filter(
    (output) => isFormattable(output) && !skillResources.has(output.path)
  );
  const results = await Promise.all(
    formattable.map((output) => formatOutput(prettier, output, projectRoot, logger))
  );
  for (const result of results) warnings.push(...result);

  return warnings;
}

/**
 * Run Prettier over one output. Returns the warnings of this file, so the
 * caller can keep them in file order.
 */
async function formatOutput(
  prettier: typeof import('prettier'),
  output: FormatterOutput,
  projectRoot: string,
  logger: Logger
): Promise<string[]> {
  const warnings: string[] = [];
  const absPath = resolve(projectRoot, output.path);

  let config: import('prettier').Options | null = null;
  try {
    config = await prettier.resolveConfig(absPath);
  } catch (err) {
    const warning = `Could not resolve Prettier config for ${output.path}: ${
      err instanceof Error ? err.message : String(err)
    }`;
    warnings.push(warning);
    logger.verbose(warning);
  }

  try {
    const formatted = await prettier.format(protectGlobAsterisks(output.content), {
      ...(config ?? {}),
      filepath: absPath,
      parser: 'markdown',
    });
    output.content = restoreGlobAsterisks(formatted);
  } catch (err) {
    const warning = `Prettier rejected ${output.path}: ${
      err instanceof Error ? err.message : String(err)
    }`;
    warnings.push(warning);
    logger.verbose(warning);
  }
  return warnings;
}

/**
 * Stand-in for a glob asterisk while Prettier runs. A private use character,
 * so Prettier treats it as plain text.
 */
const GLOB_STAR = '\uE000';

/**
 * Hide the `*` of glob paths like `services/*` from Prettier. Two of them on
 * one line (`services/*, gateways/*`) parse as emphasis, and Prettier would
 * rewrite them to `_`, so the agent reads `services/_`. Fenced code is left
 * alone because Prettier may format embedded code.
 */
function protectGlobAsterisks(content: string): string {
  if (!content.includes('/*') || content.includes(GLOB_STAR)) return content;
  let fence: string | undefined;
  return content
    .split('\n')
    .map((line) => {
      const marker = /^\s*(`{3,}|~{3,})/.exec(line)?.[1];
      if (marker) {
        if (fence === undefined) fence = marker;
        else if (marker.startsWith(fence.charAt(0)) && marker.length >= fence.length)
          fence = undefined;
        return line;
      }
      return fence === undefined ? line.replaceAll('/*', `/${GLOB_STAR}`) : line;
    })
    .join('\n');
}

function restoreGlobAsterisks(content: string): string {
  return content.replaceAll(GLOB_STAR, '*');
}

/**
 * Whether Prettier should reformat an output: markdown, except a prompt-text preview, which must
 * keep the bytes of the system message of its bundle.
 */
function isFormattable(output: FormatterOutput): boolean {
  if (!MARKDOWN_RE.test(output.path)) return false;
  return output.target === undefined || !isPromptTarget(output.target);
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
