import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import { requiredMetaId, requiredMetaVersion } from '../rules/required-meta';
import { validSemver, isValidSemver } from '../rules/valid-semver';
import type { RuleContext, ValidationMessage, ValidatorConfig } from '../types';

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
        version: '1.0.0',
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
        ruleId: 'TEST',
        ruleName: 'test',
        severity: 'error',
        ...msg,
      });
    },
  };
  return { ctx, messages };
}

describe('required-meta rules', () => {
  describe('requiredMetaId (PS001)', () => {
    it('should have correct metadata', () => {
      expect(requiredMetaId.id).toBe('PS001');
      expect(requiredMetaId.name).toBe('required-meta-id');
      expect(requiredMetaId.defaultSeverity).toBe('error');
    });

    it('should pass when id is present', () => {
      const ast = createTestProgram();
      const { ctx, messages } = createRuleContext(ast);
      requiredMetaId.validate(ctx);
      expect(messages).toHaveLength(0);
    });

    it('should report when @meta block is missing', () => {
      const ast = createTestProgram({ meta: undefined });
      const { ctx, messages } = createRuleContext(ast);
      requiredMetaId.validate(ctx);
      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('@meta block is required');
    });

    it('should report when id field is missing', () => {
      const ast = createTestProgram();
      ast.meta!.fields = { version: '1.0.0' };
      const { ctx, messages } = createRuleContext(ast);
      requiredMetaId.validate(ctx);
      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('"id" field');
    });
  });

  describe('requiredMetaVersion (PS002)', () => {
    it('should have correct metadata', () => {
      expect(requiredMetaVersion.id).toBe('PS002');
      expect(requiredMetaVersion.name).toBe('required-meta-version');
      expect(requiredMetaVersion.defaultSeverity).toBe('error');
    });

    it('should pass when version is present', () => {
      const ast = createTestProgram();
      const { ctx, messages } = createRuleContext(ast);
      requiredMetaVersion.validate(ctx);
      expect(messages).toHaveLength(0);
    });

    it('should not report when @meta block is missing (PS001 handles that)', () => {
      const ast = createTestProgram({ meta: undefined });
      const { ctx, messages } = createRuleContext(ast);
      requiredMetaVersion.validate(ctx);
      expect(messages).toHaveLength(0);
    });

    it('should report when version field is missing', () => {
      const ast = createTestProgram();
      ast.meta!.fields = { id: 'test' };
      const { ctx, messages } = createRuleContext(ast);
      requiredMetaVersion.validate(ctx);
      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('"version" field');
    });
  });
});

describe('valid-semver rule (PS003)', () => {
  describe('isValidSemver', () => {
    it('should accept valid semver versions', () => {
      expect(isValidSemver('1.0.0')).toBe(true);
      expect(isValidSemver('0.0.1')).toBe(true);
      expect(isValidSemver('10.20.30')).toBe(true);
      expect(isValidSemver('1.0.0-alpha')).toBe(true);
      expect(isValidSemver('1.0.0-alpha.1')).toBe(true);
      expect(isValidSemver('1.0.0+build')).toBe(true);
      expect(isValidSemver('1.0.0-alpha+build')).toBe(true);
    });

    it('should reject invalid versions', () => {
      expect(isValidSemver('1.0')).toBe(false);
      expect(isValidSemver('1')).toBe(false);
      expect(isValidSemver('v1.0.0')).toBe(false);
      expect(isValidSemver('1.0.0.0')).toBe(false);
      expect(isValidSemver('01.0.0')).toBe(false);
      expect(isValidSemver('1.00.0')).toBe(false);
      expect(isValidSemver('invalid')).toBe(false);
      expect(isValidSemver('')).toBe(false);
    });

    it('should reject version starting with prerelease separator', () => {
      // Tests the case where mainVersion is empty after split
      expect(isValidSemver('-alpha')).toBe(false);
      expect(isValidSemver('+build')).toBe(false);
      expect(isValidSemver('-1.0.0')).toBe(false);
      expect(isValidSemver('+1.0.0')).toBe(false);
    });
  });

  describe('validSemver rule', () => {
    it('should have correct metadata', () => {
      expect(validSemver.id).toBe('PS003');
      expect(validSemver.name).toBe('valid-semver');
      expect(validSemver.defaultSeverity).toBe('error');
    });

    it('should pass for valid semver', () => {
      const ast = createTestProgram();
      const { ctx, messages } = createRuleContext(ast);
      validSemver.validate(ctx);
      expect(messages).toHaveLength(0);
    });

    it('should report invalid semver', () => {
      const ast = createTestProgram();
      ast.meta!.fields = { id: 'test', version: 'not-a-version' };
      const { ctx, messages } = createRuleContext(ast);
      validSemver.validate(ctx);
      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('Invalid semantic version');
    });

    it('should report non-string version', () => {
      const ast = createTestProgram();
      ast.meta!.fields = { id: 'test', version: 123 };
      const { ctx, messages } = createRuleContext(ast);
      validSemver.validate(ctx);
      expect(messages).toHaveLength(1);
      expect(messages[0]!.message).toContain('must be a string');
    });

    it('should not report when version is missing (PS002 handles that)', () => {
      const ast = createTestProgram();
      ast.meta!.fields = { id: 'test' };
      const { ctx, messages } = createRuleContext(ast);
      validSemver.validate(ctx);
      expect(messages).toHaveLength(0);
    });
  });
});
