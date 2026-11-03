import { describe, expect, it } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { ClaudeFormatter } from '../formatters/claude.js';
import { FactoryFormatter } from '../formatters/factory.js';
import { CursorFormatter } from '../formatters/cursor.js';
import { GitHubFormatter } from '../formatters/github.js';
import { AntigravityFormatter } from '../formatters/antigravity.js';
import { GrokFormatter } from '../formatters/grok.js';
import { GeminiFormatter } from '../formatters/gemini.js';
import type { FormatOptions, Formatter, FormatterOutput } from '../types.js';

const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

// A glob that Prettier-style normalization escapes, and a list right after text.
const GLOB_LINE = 'Code lives in services/*, gateways/*.';
const LIST_AFTER_TEXT = 'Steps:\n- one\n- two';

function program(indent = ''): Program {
  return {
    type: 'Program',
    uses: [],
    extends: [],
    loc,
    blocks: [
      {
        type: 'Block',
        name: 'identity',
        content: { type: 'TextContent', value: 'You maintain the project.', loc },
        loc,
      },
      {
        type: 'Block',
        name: 'context',
        content: {
          type: 'TextContent',
          value: `${GLOB_LINE}\n\n${LIST_AFTER_TEXT}`
            .split('\n')
            .map((line) => (line ? indent + line : line))
            .join('\n'),
          loc,
        },
        loc,
      },
    ],
  };
}

function everything(output: FormatterOutput): string {
  return [output.content, ...(output.additionalFiles ?? []).map((file) => file.content)].join('\n');
}

const FORMATTERS: Array<{ name: string; create: () => Formatter; options: FormatOptions }> = [
  { name: 'claude', create: () => new ClaudeFormatter(), options: { version: 'full' } },
  { name: 'factory', create: () => new FactoryFormatter(), options: { version: 'full' } },
  { name: 'cursor', create: () => new CursorFormatter(), options: { version: 'full' } },
  { name: 'github', create: () => new GitHubFormatter(), options: { version: 'full' } },
  { name: 'antigravity', create: () => new AntigravityFormatter(), options: { version: 'full' } },
  { name: 'grok', create: () => new GrokFormatter(), options: { version: 'full' } },
  { name: 'gemini', create: () => new GeminiFormatter(), options: { version: 'full' } },
];

describe.each(FORMATTERS)('verbatimMarkdown in the $name formatter', ({ create, options }) => {
  it('keeps @context text as written', () => {
    const text = everything(create().format(program(), { ...options, verbatimMarkdown: true }));

    expect(text).toContain(GLOB_LINE);
    expect(text).not.toContain('/\\*');
    // No blank line is added between the text and the list.
    expect(text).toContain(LIST_AFTER_TEXT);
  });

  it('still removes the indentation of the block', () => {
    const text = everything(
      create().format(program('    '), { ...options, verbatimMarkdown: true })
    );

    expect(text).toContain(GLOB_LINE);
    expect(text).not.toContain(`    ${GLOB_LINE}`);
  });

  it('does not keep the state for the next format call', () => {
    const used = create();
    used.format(program(), { ...options, verbatimMarkdown: true });

    const afterVerbatim = everything(used.format(program(), options));
    const fresh = everything(create().format(program(), options));

    expect(afterVerbatim).toBe(fresh);
  });
});

describe('default normalization', () => {
  it('escapes the glob asterisks and puts a blank line before the list', () => {
    const text = everything(new ClaudeFormatter().format(program(), { version: 'full' }));

    expect(text).toContain('services/\\*, gateways/\\*');
    expect(text).toContain('Steps:\n\n- one');
  });
});
