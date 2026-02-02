import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation, Block } from '@promptscript/core';
import { unicodeSecurity } from '../rules/unicode-security.js';
import type { RuleContext, ValidationMessage, ValidatorConfig } from '../types.js';
import { SECURITY_STRICT, SECURITY_MODERATE, SECURITY_MINIMAL } from '../presets.js';

/**
 * Create a minimal test AST.
 */
function createTestProgram(overrides: Partial<Program> = {}): Program {
  const defaultLoc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Program',
    loc: defaultLoc,
    meta: {
      type: 'MetaBlock',
      loc: defaultLoc,
      fields: {
        id: 'test-project',
        syntax: '1.0.0',
      },
    },
    uses: [],
    blocks: [],
    extends: [],
    ...overrides,
  };
}

/**
 * Create a rule context for testing.
 */
function createRuleContext(
  ast: Program,
  config: ValidatorConfig = {}
): { ctx: RuleContext; messages: ValidationMessage[] } {
  const messages: ValidationMessage[] = [];
  const ctx: RuleContext = {
    ast,
    config,
    report: (msg) => {
      messages.push({
        ruleId: 'PS014',
        ruleName: 'unicode-security',
        severity: 'error',
        ...msg,
      });
    },
  };
  return { ctx, messages };
}

/**
 * Create a text block for testing.
 */
function createTextBlock(name: string, text: string, loc?: SourceLocation): Block {
  const defaultLoc = loc ?? { file: 'test.prs', line: 1, column: 1 };
  return {
    type: 'Block',
    name,
    loc: defaultLoc,
    content: {
      type: 'TextContent',
      value: text,
      loc: defaultLoc,
    },
  };
}

describe('unicode-security rule (PS014)', () => {
  describe('metadata', () => {
    it('should have correct metadata', () => {
      expect(unicodeSecurity.id).toBe('PS014');
      expect(unicodeSecurity.name).toBe('unicode-security');
      expect(unicodeSecurity.defaultSeverity).toBe('error');
    });
  });

  describe('bidirectional override characters', () => {
    it('should detect Right-to-Left Override (U+202E)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Check this file: test\u202Etxt.exe')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Bidirectional text override');
      expect(messages[0]!.message).toContain('U+202E');
    });

    it('should detect Left-to-Right Override (U+202D)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Text with \u202DLRO override')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Bidirectional text override');
      expect(messages[0]!.message).toContain('U+202D');
    });

    it('should detect Pop Directional Formatting (U+202C)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Text with \u202CPDF character')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Bidirectional text override');
    });

    it('should detect Right-to-Left Isolate (U+2067)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Text with \u2067RLI isolate')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Bidirectional text override');
    });

    it('should report multiple bidi characters in single message', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Multiple: \u202E\u202D\u202C\u2067')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      // Should list first 3 and indicate more
      expect(messages[0]!.message).toContain('and 1 more');
    });
  });

  describe('zero-width characters', () => {
    it('should detect Zero Width Space (U+200B)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Text with\u200Bhidden space')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Zero-width characters');
      expect(messages[0]!.message).toContain('U+200B');
    });

    it('should detect Zero Width Non-Joiner (U+200C)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Text with\u200Chidden non-joiner')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Zero-width characters');
    });

    it('should detect Zero Width Joiner (U+200D)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Text with\u200Dhidden joiner')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Zero-width characters');
    });

    it('should detect Byte Order Mark (U+FEFF)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Text with\uFEFFhidden BOM')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Zero-width characters');
      expect(messages[0]!.message).toContain('U+FEFF');
    });

    it('should detect Soft Hyphen (U+00AD)', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Text with\u00ADsoft hyphen')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Zero-width characters');
    });

    it('should report multiple zero-width characters', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Multiple:\u200B\u200C\u200D\uFEFF\u2060')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('and 2 more');
    });
  });

  describe('homograph attacks', () => {
    it('should detect Cyrillic а mixed with Latin (homograph)', () => {
      // Arrange - Using Cyrillic 'а' (U+0430) instead of Latin 'a'
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'p\u0430ssword')], // "pаssword" with Cyrillic а
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('homograph');
      expect(messages[0]!.message).toContain('Cyrillic');
    });

    it('should detect Cyrillic е mixed with Latin (homograph)', () => {
      // Arrange - Using Cyrillic 'е' (U+0435) instead of Latin 'e'
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 's\u0435cret')], // "sеcret" with Cyrillic е
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('homograph');
    });

    it('should detect Cyrillic о mixed with Latin (homograph)', () => {
      // Arrange - Using Cyrillic 'о' (U+043E) instead of Latin 'o'
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'f\u043E\u043Ebаr')], // "fооbar" with Cyrillic о and а
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('homograph');
    });

    it('should detect Greek ο mixed with Latin (homograph)', () => {
      // Arrange - Using Greek 'ο' (U+03BF) instead of Latin 'o'
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'f\u03BFo')], // "fοo" with Greek ο
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('homograph');
      expect(messages[0]!.message).toContain('Greek');
    });

    it('should detect uppercase Cyrillic lookalikes', () => {
      // Arrange - Using Cyrillic 'А' (U+0410) instead of Latin 'A'
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', '\u0410DMIN')], // "АDMIN" with Cyrillic А
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('homograph');
    });

    it('should NOT flag pure Cyrillic text (legitimate Russian)', () => {
      // Arrange - Pure Russian text without Latin mixing
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Привет мир')], // "Hello world" in Russian
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert - should NOT flag pure Cyrillic
      const homographMessages = messages.filter((m) => m.message.includes('homograph'));
      expect(homographMessages).toHaveLength(0);
    });

    it('should NOT flag pure Greek text (legitimate Greek)', () => {
      // Arrange - Pure Greek text
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Γεια σου κόσμε')], // "Hello world" in Greek
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert - should NOT flag pure Greek
      const homographMessages = messages.filter((m) => m.message.includes('homograph'));
      expect(homographMessages).toHaveLength(0);
    });
  });

  describe('excessive combining characters (Zalgo text)', () => {
    it('should detect Zalgo text with excessive diacritics', () => {
      // Arrange - Text with excessive combining marks
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'H\u0300\u0301\u0302\u0303ello')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('combining characters');
    });

    it('should detect heavy Zalgo text', () => {
      // Arrange - Heavily stacked combining characters
      const ast = createTestProgram({
        blocks: [
          createTextBlock('@skills', 'T\u0300\u0301\u0302\u0303\u0304\u0305\u0306\u0307est'),
        ],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Zalgo');
    });

    it('should allow normal diacritics (1-2 marks)', () => {
      // Arrange - Normal use of combining characters (e.g., accented letters)
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'caf\u0301e')], // café
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert - should NOT flag normal diacritics
      const zalgoMessages = messages.filter((m) => m.message.includes('combining'));
      expect(zalgoMessages).toHaveLength(0);
    });

    it('should allow Vietnamese with multiple diacritics', () => {
      // Arrange - Vietnamese text with stacked diacritics (common and legitimate)
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Ti\u1EBFng Vi\u1EC7t')], // Tiếng Việt
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert - should NOT flag legitimate multilingual content
      const zalgoMessages = messages.filter((m) => m.message.includes('combining'));
      expect(zalgoMessages).toHaveLength(0);
    });
  });

  describe('legitimate multilingual content', () => {
    it('should allow Japanese text', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'こんにちは世界')], // "Hello world" in Japanese
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages).toHaveLength(0);
    });

    it('should allow Arabic text', () => {
      // Arrange - Arabic text (naturally RTL but without override characters)
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'مرحبا بالعالم')], // "Hello world" in Arabic
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages).toHaveLength(0);
    });

    it('should allow Hebrew text', () => {
      // Arrange - Hebrew text
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'שלום עולם')], // "Hello world" in Hebrew
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages).toHaveLength(0);
    });

    it('should allow Chinese text', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', '你好世界')], // "Hello world" in Chinese
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages).toHaveLength(0);
    });

    it('should allow Korean text', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', '안녕하세요 세계')], // "Hello world" in Korean
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages).toHaveLength(0);
    });

    it('should allow mixed Latin and CJK without false positives', () => {
      // Arrange - Common technical documentation mixing English with Japanese
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Use the API (API使用方法) for integration')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages).toHaveLength(0);
    });

    it('should allow plain ASCII text', () => {
      // Arrange
      const ast = createTestProgram({
        blocks: [
          createTextBlock(
            '@skills',
            'This is perfectly normal English text with numbers 123 and symbols !@#'
          ),
        ],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages).toHaveLength(0);
    });

    it('should allow European languages with accents', () => {
      // Arrange - French, German, Spanish accented characters
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Café, Müller, niño - European characters')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages).toHaveLength(0);
    });
  });

  describe('combined attack scenarios', () => {
    it('should detect RTL override hiding file extension', () => {
      // Arrange - Classic attack: making "exe" appear as "txt"
      // "document\u202Etxt.exe" displays as "documentexe.txt" on some systems
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Download document\u202Etxt.exe')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Bidirectional');
    });

    it('should detect zero-width breaking keyword matching', () => {
      // Arrange - Zero-width space breaking "password" into "pass word"
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'The pass\u200Bword is secret')],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('Zero-width');
    });

    it('should detect homograph in URL-like content', () => {
      // Arrange - Fake "apple.com" with Cyrillic 'а'
      const ast = createTestProgram({
        blocks: [createTextBlock('@skills', 'Visit \u0430pple.com for updates')], // аpple.com
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0]!.message).toContain('homograph');
    });

    it('should detect multiple attack types in same content', () => {
      // Arrange - Multiple attack vectors combined
      const ast = createTestProgram({
        blocks: [
          createTextBlock('@skills', 'Download \u0430pp from \u202Etxt.exe\u202C with\u200Bkey'),
        ],
      });
      const { ctx, messages } = createRuleContext(ast);

      // Act
      unicodeSecurity.validate(ctx);

      // Assert - Should detect all three types
      expect(messages.length).toBeGreaterThanOrEqual(3);
      expect(messages.some((m) => m.message.includes('Bidirectional'))).toBe(true);
      expect(messages.some((m) => m.message.includes('Zero-width'))).toBe(true);
      expect(messages.some((m) => m.message.includes('homograph'))).toBe(true);
    });
  });

  describe('security presets integration', () => {
    it('should be enabled as error in SECURITY_STRICT', () => {
      expect(SECURITY_STRICT.rules?.['unicode-security']).toBe('error');
    });

    it('should be enabled as warning in SECURITY_MODERATE', () => {
      expect(SECURITY_MODERATE.rules?.['unicode-security']).toBe('warning');
    });

    it('should be disabled in SECURITY_MINIMAL', () => {
      expect(SECURITY_MINIMAL.rules?.['unicode-security']).toBe('off');
    });
  });
});
