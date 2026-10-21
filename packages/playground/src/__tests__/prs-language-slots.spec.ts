import { describe, it, expect, vi } from 'vitest';
import {
  createPrsCompletionProvider,
  prsLanguageDefinition,
  prsThemeRules,
} from '../utils/prs-language';

interface Piece {
  text: string;
  token: string;
}

type MonarchAction = string | { token: string; switchTo: string };
type MonarchRule = [RegExp, MonarchAction, string?];

/**
 * Run the Monarch string states over one line, the way Monaco steps them:
 * first matching rule wins, `@pop` leaves a state, `@name` enters one.
 */
function tokenizeLine(line: string, startState: string): Piece[] {
  const escapes = (prsLanguageDefinition['escapes'] as RegExp).source;
  const stack = [startState];
  const pieces: Piece[] = [];
  let position = 0;
  while (position < line.length) {
    const rules = prsLanguageDefinition.tokenizer[stack[stack.length - 1]!] as unknown[];
    let advanced = false;
    for (const rule of rules) {
      const [pattern, action, next] = rule as MonarchRule;
      const token = typeof action === 'string' ? action : action.token;
      const match = new RegExp(`^(?:${pattern.source.replace('@escapes', escapes)})`).exec(
        line.slice(position)
      );
      if (!match || match[0].length === 0) continue;
      pieces.push({ text: match[0], token });
      position += match[0].length;
      if (typeof action !== 'string') stack.splice(-1, 1, action.switchTo.slice(1));
      else if (next === '@pop') stack.pop();
      else if (next) stack.push(next.slice(1));
      advanced = true;
      break;
    }
    if (!advanced) throw new Error(`No rule matched at ${position} of ${line}`);
  }
  return pieces;
}

const STRING_STATES = ['string', 'stringSingle', 'multilineString'];

describe('runtime slots in the Monaco tokenizer', () => {
  it.each(STRING_STATES)('scopes {{input.name}} as a slot in %s', (state) => {
    expect(tokenizeLine('Hi {{input.name}}!', state).slice(0, 5)).toEqual([
      { text: 'Hi ', token: 'string' },
      { text: '{{', token: 'variable.template' },
      { text: 'input.', token: 'variable.slot' },
      { text: 'name', token: 'variable.name' },
      { text: '}}', token: 'variable.template' },
    ]);
  });

  it.each(STRING_STATES)('keeps a plain template variable plain in %s', (state) => {
    expect(tokenizeLine('{{name}}', state)).toEqual([
      { text: '{{', token: 'variable.template' },
      { text: 'name', token: 'variable.name' },
      { text: '}}', token: 'variable.template' },
    ]);
  });

  it.each(STRING_STATES)('does not mark other dotted names as slots in %s', (state) => {
    expect(tokenizeLine('{{inputs.a}} {{a.input.b}}', state).map((p) => p.token)).not.toContain(
      'variable.slot'
    );
  });

  it.each(STRING_STATES)('treats \\{{ as an escape, not a template, in %s', (state) => {
    const pieces = tokenizeLine('a \\{{input.x}} b', state);

    expect(pieces[1]).toEqual({ text: '\\{{', token: 'string.escape' });
    expect(pieces.map((p) => p.token)).not.toContain('variable.template');
    expect(pieces.map((p) => p.token)).not.toContain('variable.slot');
  });

  it.each(['string', 'stringSingle'])('keeps other backslash sequences in %s', (state) => {
    expect(tokenizeLine('\\n\\{', state)).toEqual([
      { text: '\\n', token: 'string.escape' },
      { text: '\\{', token: 'string.escape.invalid' },
    ]);
  });

  it('keeps a backslash in a multiline string as text', () => {
    expect(tokenizeLine('C:\\temp', 'multilineString')).toEqual([
      { text: 'C:', token: 'string' },
      { text: '\\', token: 'string' },
      { text: 'temp', token: 'string' },
    ]);
  });

  it('styles the slot token', () => {
    expect(prsThemeRules.some((rule) => rule.token === 'variable.slot')).toBe(true);
  });
});

describe('@prompts completion', () => {
  it('offers a snippet with a declared input and its slot', () => {
    const monaco = {
      languages: {
        CompletionItemKind: { Keyword: 14 },
        CompletionItemInsertTextRule: { InsertAsSnippet: 4 },
      },
    };
    const model = {
      getWordUntilPosition: vi.fn().mockReturnValue({ startColumn: 1, endColumn: 2 }),
    };
    const provider = createPrsCompletionProvider(monaco as never);

    const { suggestions } = provider.provideCompletionItems(
      model as never,
      { lineNumber: 1, column: 2 } as never,
      {} as never,
      {} as never
    ) as { suggestions: Array<{ label: string; insertText: string }> };

    const prompts = suggestions.find((item) => item.label === '@prompts');
    expect(prompts?.insertText).toContain('@prompts {');
    expect(prompts?.insertText).toContain('description: "$2"');
    expect(prompts?.insertText).toContain('{{input.$3}}');
  });
});
