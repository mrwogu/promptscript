import { describe, it, expect } from 'vitest';
import { tokenize } from '../lexer/index.js';
import {
  Meta,
  Inherit,
  Use,
  As,
  Extend,
  True,
  False,
  Null,
  Range,
  Enum,
  At,
  LBrace,
  RBrace,
  LBracket,
  RBracket,
  LParen,
  RParen,
  Colon,
  Comma,
  Equals,
  Question,
  Dot,
  DotDot,
  Dash,
  StringLiteral,
  NumberLiteral,
  TextBlock,
  Identifier,
  PathReference,
  RelativePath,
} from '../lexer/tokens.js';

describe('PSLexer', () => {
  describe('basic tokenization', () => {
    it('should tokenize whitespace and skip it', () => {
      const result = tokenize('   \n\t  ');
      expect(result.tokens).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should skip line comments', () => {
      const result = tokenize('# This is a comment\nmeta');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(Meta);
    });
  });

  describe('keywords', () => {
    it('should tokenize all keywords', () => {
      const keywords = [
        { text: 'meta', type: Meta },
        { text: 'inherit', type: Inherit },
        { text: 'use', type: Use },
        { text: 'as', type: As },
        { text: 'extend', type: Extend },
        { text: 'true', type: True },
        { text: 'false', type: False },
        { text: 'null', type: Null },
        { text: 'range', type: Range },
        { text: 'enum', type: Enum },
      ];

      for (const { text, type } of keywords) {
        const result = tokenize(text);
        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0]!.tokenType).toBe(type);
      }
    });

    it('should tokenize keywords within identifiers as identifiers', () => {
      const result = tokenize('metadata');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(Identifier);
      expect(result.tokens[0]!.image).toBe('metadata');
    });
  });

  describe('symbols', () => {
    it('should tokenize all symbols', () => {
      const symbols = [
        { text: '@', type: At },
        { text: '{', type: LBrace },
        { text: '}', type: RBrace },
        { text: '[', type: LBracket },
        { text: ']', type: RBracket },
        { text: '(', type: LParen },
        { text: ')', type: RParen },
        { text: ':', type: Colon },
        { text: ',', type: Comma },
        { text: '=', type: Equals },
        { text: '?', type: Question },
        { text: '.', type: Dot },
        { text: '..', type: DotDot },
      ];

      for (const { text, type } of symbols) {
        const result = tokenize(text);
        expect(result.tokens).toHaveLength(1);
        expect(result.tokens[0]!.tokenType).toBe(type);
      }
    });

    it('should tokenize dash before non-digit', () => {
      const result = tokenize('- "text"');
      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0]!.tokenType).toBe(Dash);
      expect(result.tokens[1]!.tokenType).toBe(StringLiteral);
    });
  });

  describe('literals', () => {
    it('should tokenize double-quoted strings', () => {
      const result = tokenize('"hello world"');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(StringLiteral);
      expect(result.tokens[0]!.image).toBe('"hello world"');
    });

    it('should tokenize single-quoted strings', () => {
      const result = tokenize("'hello world'");
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(StringLiteral);
      expect(result.tokens[0]!.image).toBe("'hello world'");
    });

    it('should tokenize strings with escape sequences', () => {
      const result = tokenize('"hello\\nworld"');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(StringLiteral);
      expect(result.tokens[0]!.image).toBe('"hello\\nworld"');
    });

    it('should tokenize integer numbers', () => {
      const result = tokenize('42');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(NumberLiteral);
      expect(result.tokens[0]!.image).toBe('42');
    });

    it('should tokenize negative numbers', () => {
      const result = tokenize('-42');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(NumberLiteral);
      expect(result.tokens[0]!.image).toBe('-42');
    });

    it('should tokenize decimal numbers', () => {
      const result = tokenize('3.14');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(NumberLiteral);
      expect(result.tokens[0]!.image).toBe('3.14');
    });
  });

  describe('text blocks', () => {
    it('should tokenize multi-line text blocks', () => {
      const result = tokenize('"""hello\nworld"""');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(TextBlock);
      expect(result.tokens[0]!.image).toBe('"""hello\nworld"""');
    });

    it('should tokenize empty text blocks', () => {
      const result = tokenize('""""""');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(TextBlock);
    });
  });

  describe('path references', () => {
    it('should tokenize absolute path references', () => {
      const result = tokenize('@core/guards/compliance');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(PathReference);
      expect(result.tokens[0]!.image).toBe('@core/guards/compliance');
    });

    it('should tokenize versioned path references', () => {
      const result = tokenize('@core/lib@1.0.0');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(PathReference);
      expect(result.tokens[0]!.image).toBe('@core/lib@1.0.0');
    });

    it('should tokenize relative paths', () => {
      const result = tokenize('./local/file');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(RelativePath);
      expect(result.tokens[0]!.image).toBe('./local/file');
    });

    it('should tokenize parent relative paths', () => {
      const result = tokenize('../parent/file');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(RelativePath);
      expect(result.tokens[0]!.image).toBe('../parent/file');
    });
  });

  describe('identifiers', () => {
    it('should tokenize simple identifiers', () => {
      const result = tokenize('myVariable');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(Identifier);
      expect(result.tokens[0]!.image).toBe('myVariable');
    });

    it('should tokenize identifiers starting with underscore', () => {
      const result = tokenize('_private');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(Identifier);
    });

    it('should tokenize identifiers with dashes', () => {
      const result = tokenize('my-variable');
      expect(result.tokens).toHaveLength(1);
      expect(result.tokens[0]!.tokenType).toBe(Identifier);
      expect(result.tokens[0]!.image).toBe('my-variable');
    });
  });

  describe('complex expressions', () => {
    it('should tokenize a meta block declaration', () => {
      const result = tokenize('@meta { id: "test" }');
      expect(result.tokens).toHaveLength(7);
      expect(result.tokens[0]!.tokenType).toBe(At);
      expect(result.tokens[1]!.tokenType).toBe(Meta);
      expect(result.tokens[2]!.tokenType).toBe(LBrace);
      expect(result.tokens[3]!.tokenType).toBe(Identifier);
      expect(result.tokens[4]!.tokenType).toBe(Colon);
      expect(result.tokens[5]!.tokenType).toBe(StringLiteral);
      expect(result.tokens[6]!.tokenType).toBe(RBrace);
    });

    it('should tokenize an array', () => {
      const result = tokenize('[1, 2, 3]');
      expect(result.tokens).toHaveLength(7);
      expect(result.tokens[0]!.tokenType).toBe(LBracket);
      expect(result.tokens[1]!.tokenType).toBe(NumberLiteral);
      expect(result.tokens[2]!.tokenType).toBe(Comma);
      expect(result.tokens[6]!.tokenType).toBe(RBracket);
    });

    it('should tokenize range type', () => {
      const result = tokenize('range(1..10)');
      expect(result.tokens).toHaveLength(6);
      expect(result.tokens[0]!.tokenType).toBe(Range);
      expect(result.tokens[1]!.tokenType).toBe(LParen);
      expect(result.tokens[2]!.tokenType).toBe(NumberLiteral);
      expect(result.tokens[3]!.tokenType).toBe(DotDot);
      expect(result.tokens[4]!.tokenType).toBe(NumberLiteral);
      expect(result.tokens[5]!.tokenType).toBe(RParen);
    });
  });

  describe('position tracking', () => {
    it('should track token positions', () => {
      const result = tokenize('meta\nidentity');
      expect(result.tokens).toHaveLength(2);
      expect(result.tokens[0]!.startLine).toBe(1);
      expect(result.tokens[0]!.startColumn).toBe(1);
      expect(result.tokens[1]!.startLine).toBe(2);
      expect(result.tokens[1]!.startColumn).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should report lexer errors for invalid characters', () => {
      const result = tokenize('`invalid`');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
