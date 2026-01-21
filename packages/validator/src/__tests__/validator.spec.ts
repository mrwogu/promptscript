import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { Validator, createValidator } from '../validator.js';

/**
 * Create a minimal valid AST for testing.
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

describe('Validator', () => {
  describe('constructor', () => {
    it('should create validator with default config', () => {
      const validator = new Validator();
      expect(validator).toBeInstanceOf(Validator);
      expect(validator.getConfig()).toEqual({});
    });

    it('should create validator with custom config', () => {
      const config = {
        rules: { 'empty-block': 'off' as const },
        requiredGuards: ['@core/guards/compliance'],
      };
      const validator = new Validator(config);
      expect(validator.getConfig()).toEqual(config);
    });
  });

  describe('validate', () => {
    it('should return valid for well-formed AST', () => {
      const validator = new Validator();
      const ast = createTestProgram();
      const result = validator.validate(ast);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing @meta block', () => {
      const validator = new Validator();
      const ast = createTestProgram({ meta: undefined });
      const result = validator.validate(ast);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.ruleId === 'PS001')).toBe(true);
    });

    it('should detect missing @meta.id', () => {
      const validator = new Validator();
      const ast = createTestProgram();
      ast.meta!.fields = { syntax: '1.0.0' };
      const result = validator.validate(ast);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.ruleId === 'PS001')).toBe(true);
    });

    it('should detect missing @meta.syntax', () => {
      const validator = new Validator();
      const ast = createTestProgram();
      ast.meta!.fields = { id: 'test' };
      const result = validator.validate(ast);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.ruleId === 'PS002')).toBe(true);
    });

    it('should detect invalid semver', () => {
      const validator = new Validator();
      const ast = createTestProgram();
      ast.meta!.fields = { id: 'test', syntax: 'invalid' };
      const result = validator.validate(ast);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.ruleId === 'PS003')).toBe(true);
    });

    it('should allow turning off rules', () => {
      const validator = new Validator({
        rules: {
          'required-meta-id': 'off',
          'required-meta-syntax': 'off',
        },
      });
      const ast = createTestProgram({ meta: undefined });
      const result = validator.validate(ast);

      // Only PS001 would be reported normally
      expect(result.errors.filter((e) => e.ruleId === 'PS001')).toHaveLength(0);
    });

    it('should change rule severity', () => {
      const validator = new Validator({
        rules: {
          'required-meta-id': 'warning',
        },
      });
      const ast = createTestProgram();
      ast.meta!.fields = { syntax: '1.0.0' };
      const result = validator.validate(ast);

      expect(result.valid).toBe(true); // No errors, only warnings
      expect(result.warnings.some((w) => w.ruleId === 'PS001')).toBe(true);
    });

    it('should categorize messages correctly', () => {
      const validator = new Validator({
        rules: {
          'empty-block': 'warning',
        },
      });
      const ast = createTestProgram();
      ast.blocks = [
        {
          type: 'Block',
          name: 'identity',
          loc: { file: 'test.prs', line: 5, column: 1 },
          content: {
            type: 'TextContent',
            value: '',
            loc: { file: 'test.prs', line: 5, column: 1 },
          },
        },
      ];
      const result = validator.validate(ast);

      expect(result.warnings.some((w) => w.ruleId === 'PS008')).toBe(true);
      expect(result.all.length).toBeGreaterThan(0);
    });
  });

  describe('addRule', () => {
    it('should add custom rule', () => {
      const validator = new Validator();
      const customRule = {
        id: 'PS999',
        name: 'custom-rule',
        description: 'Custom test rule',
        defaultSeverity: 'error' as const,
        validate: (ctx: { report: (msg: { message: string }) => void }) => {
          ctx.report({ message: 'Custom error' });
        },
      };

      validator.addRule(customRule);
      const rules = validator.getRules();

      expect(rules.some((r) => r.id === 'PS999')).toBe(true);
    });
  });

  describe('createValidator', () => {
    it('should create validator instance', () => {
      const validator = createValidator();
      expect(validator).toBeInstanceOf(Validator);
    });

    it('should accept config', () => {
      const validator = createValidator({ rules: { 'empty-block': 'off' } });
      expect(validator.getConfig().rules).toEqual({ 'empty-block': 'off' });
    });
  });
});
