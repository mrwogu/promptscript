import type { BuiltPrompt, BuiltPrompts } from '../prompt/bundle.js';
import { singleLine } from '../prompt/compose.js';
import { PromptFormatter, type PromptRender } from '../prompt/prompt-formatter.js';
import type { FormatterVersionMap, FormatterWarning } from '../types.js';

export type PromptTextVersion = 'v1';

export const PROMPT_TEXT_VERSIONS = {
  v1: {
    name: 'v1',
    description: 'One Markdown preview per prompt plus prompts/README.md',
    outputPath: 'prompts/README.md',
  },
} as const satisfies FormatterVersionMap;

function systemMessage(prompt: BuiltPrompt): string | undefined {
  return prompt.bundle.messages.find((message) => message.role === 'system')?.content;
}

/** A table cell on one line, with backslashes and pipes escaped. */
function cell(text: string): string {
  return singleLine(text)
    .replaceAll('\\', String.raw`\\`)
    .replaceAll('|', String.raw`\|`);
}

function readme(listed: readonly BuiltPrompt[]): string {
  const rows = [...listed]
    .sort((a, b) => Number(a.key > b.key) - Number(a.key < b.key))
    .map(
      ({ key, bundle }) => `| \`${key}\` | ${cell(bundle.description)} | [${key}.md](${key}.md) |`
    );
  return [
    '# Prompt previews',
    '',
    'Each file holds the system message of one prompt, composed from the source.',
    'It is a preview of the bundle, not an approved artifact. Placeholders are left as they are.',
    '',
    '| Key | Description | File |',
    '| --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
}

/**
 * Writes the composed system message of each prompt as Markdown, for reading.
 *
 * Writes `prompts/<key>.md` for each prompt that has a system message and `prompts/README.md`
 * as the primary file. The text is the system message of the `bundle` target, and the hash
 * of that bundle sits in a comment at the top of each file. A prompt without a system message
 * is skipped with a diagnostic.
 */
export class PromptTextFormatter extends PromptFormatter {
  constructor() {
    super('prompt-text', PROMPT_TEXT_VERSIONS.v1.outputPath, 'Prompt previews (Markdown)');
  }

  static getSupportedVersions(): FormatterVersionMap {
    return PROMPT_TEXT_VERSIONS;
  }

  protected render(built: BuiltPrompts): PromptRender {
    const listed: BuiltPrompt[] = [];
    const warnings: FormatterWarning[] = [];
    for (const prompt of built.prompts) {
      if (systemMessage(prompt) !== undefined) {
        listed.push(prompt);
        continue;
      }
      warnings.push({
        code: 'PS4002',
        ruleName: 'target-compatibility',
        message: `Prompt "${prompt.key}" has no system message, so the prompt-text target skips it.`,
        suggestion: 'Add system text to the prompt or compose blocks into it.',
        location: prompt.loc,
      });
    }
    if (listed.length === 0) return { files: [], warnings };
    return {
      primary: readme(listed),
      files: listed.map((prompt) => ({
        name: `${prompt.key}.md`,
        content: `<!-- bundle: ${prompt.bundle.contentHash} -->\n\n${systemMessage(prompt)}\n`,
      })),
      warnings,
    };
  }
}
