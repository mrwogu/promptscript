import { describe, it, expect, vi } from 'vitest';
import { BLOCK_TYPES } from '@promptscript/core';
import {
  PRS_LANGUAGE_ID,
  prsLanguageDefinition,
  prsLanguageConfiguration,
  prsThemeRules,
  registerPrsLanguage,
  createPrsCompletionProvider,
} from '../utils/prs-language';

interface RootToken {
  image: string;
  token: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function resolveRootToken(source: string): RootToken {
  const rootRules = prsLanguageDefinition.tokenizer.root as unknown[];

  for (const candidate of rootRules) {
    if (!Array.isArray(candidate)) continue;

    const [pattern, action] = candidate as unknown[];
    if (!(pattern instanceof RegExp)) continue;

    const anchoredPattern = new RegExp(`^(?:${pattern.source})`, pattern.flags.replace('g', ''));
    const match = anchoredPattern.exec(source);
    if (!match) continue;

    if (typeof action === 'string') {
      return { image: match[0], token: action };
    }
    if (!isRecord(action) || !isRecord(action['cases'])) {
      throw new Error(`Unsupported Monarch action for ${match[0]}`);
    }

    const cases = action['cases'];
    const directives = prsLanguageDefinition.directives as string[];
    const keywords = prsLanguageDefinition.keywords as string[];
    if (directives.includes(match[0]) && typeof cases['@directives'] === 'string') {
      return { image: match[0], token: cases['@directives'] };
    }
    if (keywords.includes(match[0]) && typeof cases['@keywords'] === 'string') {
      return { image: match[0], token: cases['@keywords'] };
    }
    if (typeof cases['@default'] === 'string') {
      return { image: match[0], token: cases['@default'] };
    }
  }

  throw new Error(`No root token matched ${source}`);
}

describe('prs-language', () => {
  describe('PRS_LANGUAGE_ID', () => {
    it('should be "promptscript"', () => {
      expect(PRS_LANGUAGE_ID).toBe('promptscript');
    });
  });

  describe('prsLanguageDefinition', () => {
    it('should have correct token postfix', () => {
      expect(prsLanguageDefinition.tokenPostfix).toBe('.prs');
    });

    it('should define all directives', () => {
      const directives = prsLanguageDefinition.directives as string[];
      expect(directives).toContain('@meta');
      expect(directives).toContain('@inherit');
      expect(directives).toContain('@identity');
      expect(directives).toContain('@context');
      expect(directives).toContain('@standards');
      expect(directives).toContain('@restrictions');
      expect(directives).toContain('@shortcuts');
      expect(directives).toContain('@commands');
      expect(directives).toContain('@skills');
      expect(directives).toContain('@examples');
      expect(directives).toContain('@hooks');
      expect(directives).toContain('@mcpServers');
      expect(directives).toContain('@plugins');
      expect(BLOCK_TYPES.every((blockType) => directives.includes(`@${blockType}`))).toBe(true);
    });

    it('should have root tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer).toBeDefined();
      expect(tokenizer.root).toBeDefined();
      expect(Array.isArray(tokenizer.root)).toBe(true);
    });

    it('should have string tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer.string).toBeDefined();
      expect(Array.isArray(tokenizer.string)).toBe(true);
    });

    it('should have multilineString tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer.multilineString).toBeDefined();
      expect(Array.isArray(tokenizer.multilineString)).toBe(true);
    });

    it('should have single-quoted string tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer.stringSingle).toBeDefined();
      expect(Array.isArray(tokenizer.stringSingle)).toBe(true);
    });

    it('should have whitespace tokenizer rules', () => {
      const tokenizer = prsLanguageDefinition.tokenizer;
      expect(tokenizer.whitespace).toBeDefined();
      expect(Array.isArray(tokenizer.whitespace)).toBe(true);
    });

    it('should define keywords', () => {
      const keywords = prsLanguageDefinition.keywords as string[];
      expect(keywords).toContain('true');
      expect(keywords).toContain('false');
      expect(keywords).toContain('null');
      expect(keywords).toContain('range');
    });

    it('should tokenize directives and import paths without splitting them', () => {
      expect(resolveRootToken('@mcpServers')).toEqual({
        image: '@mcpServers',
        token: 'keyword.directive',
      });
      expect(resolveRootToken('@custom-name')).toEqual({
        image: '@custom-name',
        token: 'identifier.directive',
      });
      expect(resolveRootToken('@scope/path@^1.0.0')).toEqual({
        image: '@scope/path@^1.0.0',
        token: 'string.url',
      });
      expect(resolveRootToken('../shared/base.prs')).toEqual({
        image: '../shared/base.prs',
        token: 'string.url',
      });
    });

    it('should prioritize compound values over punctuation', () => {
      expect(resolveRootToken('{{name}}')).toEqual({
        image: '{{',
        token: 'variable.template',
      });
      expect(resolveRootToken('${lower_name}')).toEqual({
        image: '${lower_name}',
        token: 'variable.env',
      });
      expect(resolveRootToken('-3.14')).toEqual({
        image: '-3.14',
        token: 'number',
      });
      expect(resolveRootToken('..')).toEqual({
        image: '..',
        token: 'operator.range',
      });
      expect(resolveRootToken("'text'")).toEqual({
        image: "'",
        token: 'string',
      });
    });
  });

  describe('prsLanguageConfiguration', () => {
    it('should define line comment', () => {
      expect(prsLanguageConfiguration.comments?.lineComment).toBe('#');
    });

    it('should define brackets', () => {
      const brackets = prsLanguageConfiguration.brackets;
      expect(brackets).toContainEqual(['{', '}']);
      expect(brackets).toContainEqual(['[', ']']);
      expect(brackets).toContainEqual(['(', ')']);
    });

    it('should define auto-closing pairs', () => {
      const pairs = prsLanguageConfiguration.autoClosingPairs;
      expect(pairs).toBeDefined();
      expect(pairs?.length).toBeGreaterThan(0);

      const braces = pairs?.find((p) => p.open === '{');
      expect(braces?.close).toBe('}');

      const quotes = pairs?.find((p) => p.open === '"');
      expect(quotes?.close).toBe('"');
      expect(quotes?.notIn).toContain('string');

      const singleQuotes = pairs?.find((p) => p.open === "'");
      expect(singleQuotes?.close).toBe("'");
      expect(singleQuotes?.notIn).toContain('string');

      const templates = pairs?.find((p) => p.open === '{{');
      expect(templates?.close).toBe('}}');
    });

    it('should define surrounding pairs', () => {
      const pairs = prsLanguageConfiguration.surroundingPairs;
      expect(pairs).toBeDefined();
      expect(pairs?.length).toBeGreaterThan(0);
    });

    it('should define folding markers', () => {
      const folding = prsLanguageConfiguration.folding;
      expect(folding?.markers).toBeDefined();
      expect(folding?.markers?.start).toBeInstanceOf(RegExp);
      expect(folding?.markers?.end).toBeInstanceOf(RegExp);
      expect(folding?.markers?.start?.test('@custom-block {')).toBe(true);
    });
  });

  describe('prsThemeRules', () => {
    it('should define directive token style', () => {
      const directiveRule = prsThemeRules.find((r) => r.token === 'keyword.directive');
      expect(directiveRule).toBeDefined();
      expect(directiveRule?.fontStyle).toBe('bold');
    });

    it('should define string token style', () => {
      const stringRule = prsThemeRules.find((r) => r.token === 'string');
      expect(stringRule).toBeDefined();
      expect(stringRule?.foreground).toBeDefined();
    });

    it('should define comment token style', () => {
      const commentRule = prsThemeRules.find((r) => r.token === 'comment');
      expect(commentRule).toBeDefined();
      expect(commentRule?.fontStyle).toBe('italic');
    });

    it('should define number token style', () => {
      const numberRule = prsThemeRules.find((r) => r.token === 'number');
      expect(numberRule).toBeDefined();
    });

    it('should define all essential tokens', () => {
      const tokens = prsThemeRules.map((r) => r.token);
      expect(tokens).toContain('keyword.directive');
      expect(tokens).toContain('keyword');
      expect(tokens).toContain('string');
      expect(tokens).toContain('comment');
      expect(tokens).toContain('number');
      expect(tokens).toContain('identifier');
      expect(tokens).toContain('delimiter');
    });
  });

  describe('registerPrsLanguage', () => {
    it('should register language with Monaco', () => {
      const mockMonaco = {
        languages: {
          getLanguages: vi.fn().mockReturnValue([]),
          register: vi.fn(),
          setMonarchTokensProvider: vi.fn(),
          setLanguageConfiguration: vi.fn(),
        },
        editor: {
          defineTheme: vi.fn(),
        },
      };

      registerPrsLanguage(mockMonaco as never);

      expect(mockMonaco.languages.register).toHaveBeenCalledWith(
        expect.objectContaining({
          id: PRS_LANGUAGE_ID,
          extensions: ['.prs'],
        })
      );
      expect(mockMonaco.languages.setMonarchTokensProvider).toHaveBeenCalledWith(
        PRS_LANGUAGE_ID,
        prsLanguageDefinition
      );
      expect(mockMonaco.languages.setLanguageConfiguration).toHaveBeenCalledWith(
        PRS_LANGUAGE_ID,
        prsLanguageConfiguration
      );
      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith(
        'prs-dark',
        expect.objectContaining({
          base: 'vs-dark',
          inherit: true,
          rules: prsThemeRules,
        })
      );
    });

    it('should not register if language already exists', () => {
      const mockMonaco = {
        languages: {
          getLanguages: vi.fn().mockReturnValue([{ id: PRS_LANGUAGE_ID }]),
          register: vi.fn(),
          setMonarchTokensProvider: vi.fn(),
          setLanguageConfiguration: vi.fn(),
        },
        editor: {
          defineTheme: vi.fn(),
        },
      };

      registerPrsLanguage(mockMonaco as never);

      expect(mockMonaco.languages.register).not.toHaveBeenCalled();
      expect(mockMonaco.languages.setMonarchTokensProvider).not.toHaveBeenCalled();
    });
  });

  describe('createPrsCompletionProvider', () => {
    it('should return a completion provider', () => {
      const mockMonaco = {
        languages: {
          CompletionItemKind: {
            Keyword: 14,
          },
          CompletionItemInsertTextRule: {
            InsertAsSnippet: 4,
          },
        },
      };

      const provider = createPrsCompletionProvider(mockMonaco as never);

      expect(provider).toBeDefined();
      expect(typeof provider.provideCompletionItems).toBe('function');
    });

    it('should provide directive completions', () => {
      const mockMonaco = {
        languages: {
          CompletionItemKind: {
            Keyword: 14,
          },
          CompletionItemInsertTextRule: {
            InsertAsSnippet: 4,
          },
        },
      };

      const mockModel = {
        getWordUntilPosition: vi.fn().mockReturnValue({
          word: '@',
          startColumn: 1,
          endColumn: 2,
        }),
      };

      const mockPosition = {
        lineNumber: 1,
        column: 2,
      };

      const provider = createPrsCompletionProvider(mockMonaco as never);
      const result = provider.provideCompletionItems(mockModel as never, mockPosition as never);

      expect(result.suggestions).toBeDefined();
      expect(result.suggestions.length).toBeGreaterThan(0);

      const labels = result.suggestions.map((s: { label: string }) => s.label);
      expect(labels).toContain('@meta');
      expect(labels).toContain('@inherit');
      expect(labels).toContain('@identity');
      expect(labels).toContain('@context');
      expect(labels).toContain('@standards');
      expect(labels).toContain('@restrictions');
      expect(labels).toContain('@shortcuts');
      expect(labels).toContain('@examples');
    });

    it('should provide snippet insertText for directives', () => {
      const mockMonaco = {
        languages: {
          CompletionItemKind: {
            Keyword: 14,
          },
          CompletionItemInsertTextRule: {
            InsertAsSnippet: 4,
          },
        },
      };

      const mockModel = {
        getWordUntilPosition: vi.fn().mockReturnValue({
          word: '',
          startColumn: 1,
          endColumn: 1,
        }),
      };

      const mockPosition = {
        lineNumber: 1,
        column: 1,
      };

      const provider = createPrsCompletionProvider(mockMonaco as never);
      const result = provider.provideCompletionItems(mockModel as never, mockPosition as never);

      const metaSuggestion = result.suggestions.find((s: { label: string }) => s.label === '@meta');
      expect(metaSuggestion).toBeDefined();
      expect(metaSuggestion.insertText).toContain('@meta');
      expect(metaSuggestion.insertText).toContain('$1');
      expect(metaSuggestion.insertTextRules).toBe(4); // InsertAsSnippet
    });

    it('should include documentation for suggestions', () => {
      const mockMonaco = {
        languages: {
          CompletionItemKind: {
            Keyword: 14,
          },
          CompletionItemInsertTextRule: {
            InsertAsSnippet: 4,
          },
        },
      };

      const mockModel = {
        getWordUntilPosition: vi.fn().mockReturnValue({
          word: '',
          startColumn: 1,
          endColumn: 1,
        }),
      };

      const mockPosition = {
        lineNumber: 1,
        column: 1,
      };

      const provider = createPrsCompletionProvider(mockMonaco as never);
      const result = provider.provideCompletionItems(mockModel as never, mockPosition as never);

      result.suggestions.forEach((suggestion: { documentation?: string }) => {
        expect(suggestion.documentation).toBeDefined();
        expect(typeof suggestion.documentation).toBe('string');
      });
    });
  });
});
