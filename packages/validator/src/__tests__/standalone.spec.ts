import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation } from '@promptscript/core';
import {
  validate,
  Validator,
  formatValidationMessage,
  formatValidationMessages,
  formatValidationResult,
  formatDiagnostic,
  formatDiagnostics,
  type ValidationMessage,
} from '../index.js';

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

describe('standalone validate function', () => {
  it('should validate an AST', () => {
    const ast = createTestProgram();
    const result = validate(ast);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept config options', () => {
    const ast = createTestProgram({ meta: undefined });
    const result = validate(ast, {
      rules: {
        'required-meta-id': 'off',
        'required-meta-syntax': 'off',
      },
    });

    // Without meta, but rules are off
    expect(result.errors.filter((e) => e.ruleId === 'PS001')).toHaveLength(0);
    expect(result.errors.filter((e) => e.ruleId === 'PS002')).toHaveLength(0);
  });

  it('should reuse validator instance if provided', () => {
    const validator = new Validator();
    const ast = createTestProgram();

    const result = validate(ast, { validator });

    expect(result.valid).toBe(true);
  });

  it('should support disableRules option', () => {
    const ast = createTestProgram({ meta: undefined });
    const result = validate(ast, {
      disableRules: ['required-meta-id', 'required-meta-syntax'],
    });

    expect(result.errors.filter((e) => e.ruleId === 'PS001')).toHaveLength(0);
    expect(result.errors.filter((e) => e.ruleId === 'PS002')).toHaveLength(0);
  });

  it('should support customRules option', () => {
    const ast = createTestProgram();
    const result = validate(ast, {
      customRules: [
        {
          id: 'CUSTOM001',
          name: 'always-error',
          description: 'Always reports an error',
          defaultSeverity: 'error',
          validate: (ctx) => {
            ctx.report({ message: 'Custom error triggered' });
          },
        },
      ],
    });

    expect(result.errors.some((e) => e.ruleId === 'CUSTOM001')).toBe(true);
  });
});

describe('Validator.removeRule', () => {
  it('should remove rule by name', () => {
    const validator = new Validator();
    const initialCount = validator.getRules().length;

    const removed = validator.removeRule('required-meta-id');

    expect(removed).toBe(true);
    expect(validator.getRules().length).toBe(initialCount - 1);
    expect(validator.getRules().some((r) => r.name === 'required-meta-id')).toBe(false);
  });

  it('should remove rule by id', () => {
    const validator = new Validator();

    const removed = validator.removeRule('PS001');

    expect(removed).toBe(true);
    expect(validator.getRules().some((r) => r.id === 'PS001')).toBe(false);
  });

  it('should return false for non-existent rule', () => {
    const validator = new Validator();

    const removed = validator.removeRule('non-existent-rule');

    expect(removed).toBe(false);
  });
});

describe('Validator with disableRules config', () => {
  it('should skip disabled rules by name', () => {
    const validator = new Validator({
      disableRules: ['required-meta-id'],
    });
    const ast = createTestProgram({ meta: undefined });

    const result = validator.validate(ast);

    expect(result.errors.some((e) => e.ruleId === 'PS001')).toBe(false);
  });

  it('should skip disabled rules by id', () => {
    const validator = new Validator({
      disableRules: ['PS001'],
    });
    const ast = createTestProgram({ meta: undefined });

    const result = validator.validate(ast);

    expect(result.errors.some((e) => e.ruleId === 'PS001')).toBe(false);
  });
});

describe('formatValidationMessage', () => {
  const baseMessage: ValidationMessage = {
    ruleId: 'PS001',
    ruleName: 'required-meta-id',
    severity: 'error',
    message: 'Missing required @meta.id field',
  };

  it('should format basic message', () => {
    const result = formatValidationMessage(baseMessage);

    expect(result).toContain('error');
    expect(result).toContain('Missing required @meta.id field');
    expect(result).toContain('✖');
  });

  it('should include location when present', () => {
    const message: ValidationMessage = {
      ...baseMessage,
      location: { file: 'project.prs', line: 5, column: 3 },
    };
    const result = formatValidationMessage(message);

    expect(result).toContain('project.prs:5:3');
  });

  it('should include rule ID when requested', () => {
    const result = formatValidationMessage(baseMessage, { includeRuleId: true });

    expect(result).toContain('[PS001]');
  });

  it('should include suggestion when present', () => {
    const message: ValidationMessage = {
      ...baseMessage,
      suggestion: 'Add id: "your-project" to @meta block',
    };
    const result = formatValidationMessage(message);

    expect(result).toContain('Suggestion:');
    expect(result).toContain('Add id:');
  });

  it('should skip suggestion when disabled', () => {
    const message: ValidationMessage = {
      ...baseMessage,
      suggestion: 'Some suggestion',
    };
    const result = formatValidationMessage(message, { includeSuggestions: false });

    expect(result).not.toContain('Suggestion:');
  });

  it('should apply colors when enabled', () => {
    const result = formatValidationMessage(baseMessage, { color: true });

    expect(result).toContain('\x1b[31m'); // Red for error
    expect(result).toContain('\x1b[0m'); // Reset
  });

  it('should use correct color for warning', () => {
    const message: ValidationMessage = { ...baseMessage, severity: 'warning' };
    const result = formatValidationMessage(message, { color: true });

    expect(result).toContain('\x1b[33m'); // Yellow
  });

  it('should use correct color for info', () => {
    const message: ValidationMessage = { ...baseMessage, severity: 'info' };
    const result = formatValidationMessage(message, { color: true });

    expect(result).toContain('\x1b[34m'); // Blue
  });
});

describe('formatValidationMessages', () => {
  it('should format multiple messages', () => {
    const messages: ValidationMessage[] = [
      { ruleId: 'PS001', ruleName: 'rule1', severity: 'error', message: 'Error 1' },
      { ruleId: 'PS002', ruleName: 'rule2', severity: 'warning', message: 'Warning 1' },
    ];
    const result = formatValidationMessages(messages);

    expect(result).toContain('Error 1');
    expect(result).toContain('Warning 1');
    expect(result.split('\n').length).toBe(2);
  });

  it('should return empty string for empty array', () => {
    const result = formatValidationMessages([]);
    expect(result).toBe('');
  });
});

describe('formatValidationResult', () => {
  it('should format result with summary', () => {
    const ast = createTestProgram({ meta: undefined });
    const validator = new Validator();
    const validationResult = validator.validate(ast);

    const result = formatValidationResult(validationResult);

    expect(result).toContain('error');
    expect(result).toContain('✖');
  });

  it('should show success message for valid result', () => {
    const ast = createTestProgram();
    const validator = new Validator();
    const validationResult = validator.validate(ast);

    const result = formatValidationResult(validationResult);

    expect(result).toContain('No issues found');
    expect(result).toContain('✓');
  });

  it('should format result with warnings', () => {
    const ast = createTestProgram();
    // Add an empty block to trigger warning
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
    const validator = new Validator({
      rules: {
        'empty-block': 'warning',
      },
    });
    const validationResult = validator.validate(ast);

    const result = formatValidationResult(validationResult);

    expect(result).toContain('warning');
    expect(result).toContain('⚠');
  });

  it('should format result with warnings using color', () => {
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
    const validator = new Validator({
      rules: {
        'empty-block': 'warning',
      },
    });
    const validationResult = validator.validate(ast);

    const result = formatValidationResult(validationResult, { color: true });

    expect(result).toContain('\x1b[33m'); // Yellow for warning
  });

  it('should format result with info messages', () => {
    const ast = createTestProgram();
    const validator = new Validator();
    // Add a custom rule that reports info
    validator.addRule({
      id: 'INFO001',
      name: 'test-info',
      description: 'Reports an info',
      defaultSeverity: 'info',
      validate: (ctx) => {
        ctx.report({ message: 'This is an info message' });
      },
    });
    const validationResult = validator.validate(ast);

    const result = formatValidationResult(validationResult);

    expect(result).toContain('info');
    expect(result).toContain('ℹ');
  });

  it('should format result with info messages using color', () => {
    const ast = createTestProgram();
    const validator = new Validator();
    validator.addRule({
      id: 'INFO001',
      name: 'test-info',
      description: 'Reports an info',
      defaultSeverity: 'info',
      validate: (ctx) => {
        ctx.report({ message: 'This is an info message' });
      },
    });
    const validationResult = validator.validate(ast);

    const result = formatValidationResult(validationResult, { color: true });

    expect(result).toContain('\x1b[34m'); // Blue for info
  });

  it('should format result with success message using color', () => {
    const ast = createTestProgram();
    const validator = new Validator();
    const validationResult = validator.validate(ast);

    const result = formatValidationResult(validationResult, { color: true });

    expect(result).toContain('\x1b[32m'); // Green for success
  });
});

describe('formatDiagnostic/formatDiagnostics aliases', () => {
  it('should be aliases for formatValidationMessage/Messages', () => {
    expect(formatDiagnostic).toBe(formatValidationMessage);
    expect(formatDiagnostics).toBe(formatValidationMessages);
  });
});
