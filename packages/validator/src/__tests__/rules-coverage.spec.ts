import { describe, it, expect } from 'vitest';
import type { Program, SourceLocation, Block, Value } from '@promptscript/core';
import { allRules, getRuleById, getRuleByName } from '../rules/index.js';
import { deprecated } from '../rules/deprecated.js';
import { validPath, isValidPath } from '../rules/valid-path.js';
import { requiredGuards } from '../rules/required-guards.js';
import { validParams } from '../rules/valid-params.js';
import type { RuleContext, ValidationMessage, ValidatorConfig } from '../types.js';

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

/**
 * Create a block with text content.
 */
function createTextBlock(name: string, text: string, loc?: SourceLocation): Block {
  const defaultLoc: SourceLocation = loc ?? { file: 'test.prs', line: 1, column: 1 };
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

describe('rules/index.ts coverage', () => {
  describe('allRules', () => {
    it('should contain all validation rules', () => {
      expect(allRules).toHaveLength(14);
      expect(allRules.map((r) => r.id)).toEqual([
        'PS001',
        'PS002',
        'PS003',
        'PS004',
        'PS005',
        'PS006',
        'PS007',
        'PS008',
        'PS009',
        'PS010',
        'PS011',
        'PS012',
        'PS013',
        'PS014',
      ]);
    });
  });

  describe('getRuleById', () => {
    it('should return rule by id', () => {
      const rule = getRuleById('PS001');
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('PS001');
      expect(rule?.name).toBe('required-meta-id');
    });

    it('should return undefined for unknown id', () => {
      const rule = getRuleById('PS999');
      expect(rule).toBeUndefined();
    });

    it('should find each rule by its id', () => {
      for (const expected of allRules) {
        const found = getRuleById(expected.id);
        expect(found).toBe(expected);
      }
    });
  });

  describe('getRuleByName', () => {
    it('should return rule by name', () => {
      const rule = getRuleByName('required-meta-id');
      expect(rule).toBeDefined();
      expect(rule?.id).toBe('PS001');
    });

    it('should return undefined for unknown name', () => {
      const rule = getRuleByName('unknown-rule');
      expect(rule).toBeUndefined();
    });

    it('should find each rule by its name', () => {
      for (const expected of allRules) {
        const found = getRuleByName(expected.name);
        expect(found).toBe(expected);
      }
    });
  });
});

describe('deprecated rule (PS007) additional coverage', () => {
  it('should detect deprecated blocks when configured', () => {
    // Create AST with a block that would be deprecated
    const ast = createTestProgram({
      blocks: [createTextBlock('identity', 'Content')],
    });
    const { ctx, messages } = createRuleContext(ast);
    deprecated.validate(ctx);
    // Currently no deprecated blocks configured, so should pass
    expect(messages).toHaveLength(0);
  });

  it('should check meta fields for deprecation', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: {
          id: 'test',
          version: '1.0.0',
          customField: 'value',
        },
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    deprecated.validate(ctx);
    // No deprecated fields currently configured
    expect(messages).toHaveLength(0);
  });

  it('should handle AST without meta block for deprecation check', () => {
    const ast = createTestProgram({ meta: undefined });
    const { ctx, messages } = createRuleContext(ast);
    deprecated.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should handle meta block without fields', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: undefined as unknown as Record<string, Value>,
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    deprecated.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should iterate over all blocks checking for deprecation', () => {
    // Test with multiple blocks to ensure the loop iterates
    const ast = createTestProgram({
      blocks: [
        createTextBlock('identity', 'Content 1'),
        createTextBlock('context', 'Content 2'),
        createTextBlock('standards', 'Content 3'),
        createTextBlock('guards', 'Content 4'),
      ],
    });
    const { ctx, messages } = createRuleContext(ast);
    deprecated.validate(ctx);
    // No deprecated blocks configured, all should pass
    expect(messages).toHaveLength(0);
  });

  it('should iterate over all meta fields checking for deprecation', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: {
          id: 'test',
          version: '1.0.0',
          author: 'test-author',
          description: 'test-description',
          tags: ['tag1', 'tag2'],
          custom1: 'value1',
          custom2: 'value2',
        },
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    deprecated.validate(ctx);
    // No deprecated fields currently configured
    expect(messages).toHaveLength(0);
  });

  it('should use meta.loc when available for deprecation reporting', () => {
    const metaLoc: SourceLocation = { file: 'test.prs', line: 5, column: 3 };
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc: metaLoc,
        fields: {
          id: 'test',
          version: '1.0.0',
        },
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    deprecated.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should fallback to ast.loc when meta.loc is undefined', () => {
    const astLoc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc: undefined as unknown as SourceLocation,
        fields: {
          id: 'test',
          version: '1.0.0',
        },
      },
    });
    ast.loc = astLoc;
    const { ctx, messages } = createRuleContext(ast);
    deprecated.validate(ctx);
    expect(messages).toHaveLength(0);
  });
});

describe('valid-path rule (PS006) additional coverage', () => {
  describe('isValidPath edge cases', () => {
    it('should handle complex namespace paths', () => {
      expect(isValidPath('@org-name/path/to/deeply/nested/file')).toBe(true);
      expect(isValidPath('@a/b')).toBe(true);
    });

    it('should reject malformed paths', () => {
      expect(isValidPath('@/missing-namespace')).toBe(false);
      expect(isValidPath('@namespace/')).toBe(false);
      expect(isValidPath('@@double')).toBe(false);
    });
  });

  it('should report invalid inherit paths', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      inherit: {
        type: 'InheritDeclaration',
        loc,
        path: {
          type: 'PathReference',
          raw: 'invalid-path-no-prefix',
          namespace: '',
          segments: ['invalid'],
          isRelative: false,
          loc,
        },
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validPath.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Invalid path reference');
  });

  it('should report invalid use paths', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      uses: [
        {
          type: 'UseDeclaration',
          loc,
          path: {
            type: 'PathReference',
            raw: 'bad-path',
            namespace: '',
            segments: ['bad'],
            isRelative: false,
            loc,
          },
        },
      ],
    });
    const { ctx, messages } = createRuleContext(ast);
    validPath.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Invalid path reference');
  });

  it('should validate multiple use declarations', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      uses: [
        {
          type: 'UseDeclaration',
          loc,
          path: {
            type: 'PathReference',
            raw: '@valid/path',
            namespace: 'valid',
            segments: ['path'],
            isRelative: false,
            loc,
          },
        },
        {
          type: 'UseDeclaration',
          loc,
          path: {
            type: 'PathReference',
            raw: 'invalid',
            namespace: '',
            segments: [],
            isRelative: false,
            loc,
          },
        },
      ],
    });
    const { ctx, messages } = createRuleContext(ast);
    validPath.validate(ctx);
    expect(messages).toHaveLength(1);
  });
});

describe('required-guards rule (PS004) additional coverage', () => {
  it('should pass when empty requiredGuards array', () => {
    const ast = createTestProgram();
    const { ctx, messages } = createRuleContext(ast, {
      requiredGuards: [],
    });
    requiredGuards.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should extract guards from object content', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'guards',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              '@core/guards/compliance': true,
              '@core/guards/security': { enabled: true },
            },
            loc,
          },
        },
      ],
    });
    const { ctx, messages } = createRuleContext(ast, {
      requiredGuards: ['@core/guards/compliance'],
    });
    requiredGuards.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should report when guards in object dont include required', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'guards',
          loc,
          content: {
            type: 'ObjectContent',
            properties: {
              '@core/guards/security': true,
            },
            loc,
          },
        },
      ],
    });
    const { ctx, messages } = createRuleContext(ast, {
      requiredGuards: ['@core/guards/compliance'],
    });
    requiredGuards.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('@core/guards/compliance');
  });

  it('should handle guards block with text content', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'guards',
          loc,
          content: {
            type: 'TextContent',
            value: 'Some text',
            loc,
          },
        },
      ],
    });
    const { ctx, messages } = createRuleContext(ast, {
      requiredGuards: ['@core/guards/compliance'],
    });
    requiredGuards.validate(ctx);
    // Text content doesn't have guards, so it should report
    expect(messages).toHaveLength(1);
  });

  it('should check multiple required guards', () => {
    const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };
    const ast = createTestProgram({
      blocks: [
        {
          type: 'Block',
          name: 'guards',
          loc,
          content: {
            type: 'ArrayContent',
            elements: ['@core/guards/compliance'],
            loc,
          },
        },
      ],
    });
    const { ctx, messages } = createRuleContext(ast, {
      requiredGuards: ['@core/guards/compliance', '@core/guards/security', '@core/guards/privacy'],
    });
    requiredGuards.validate(ctx);
    expect(messages).toHaveLength(2); // Missing security and privacy
  });
});

describe('valid-params rule (PS009) coverage', () => {
  const loc: SourceLocation = { file: 'test.prs', line: 1, column: 1 };

  it('should pass when no params defined', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: undefined,
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should pass when params is empty array', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should pass for valid string param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'projectName',
            paramType: { kind: 'string' },
            optional: false,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should pass for valid number param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'port',
            paramType: { kind: 'number' },
            optional: false,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should pass for valid boolean param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'strict',
            paramType: { kind: 'boolean' },
            optional: false,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should pass for valid enum param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'mode',
            paramType: { kind: 'enum', options: ['dev', 'prod'] },
            optional: false,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should report duplicate param names', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'name',
            paramType: { kind: 'string' },
            optional: false,
            loc,
          },
          {
            type: 'ParamDefinition',
            name: 'name',
            paramType: { kind: 'string' },
            optional: false,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('Duplicate parameter');
    expect(messages[0]!.message).toContain('name');
  });

  it('should report wrong default type for string param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'name',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: 123,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
    expect(messages[0]!.message).toContain('string');
    expect(messages[0]!.message).toContain('number');
  });

  it('should report wrong default type for number param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'count',
            paramType: { kind: 'number' },
            optional: true,
            defaultValue: 'not a number',
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
  });

  it('should report wrong default type for boolean param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'enabled',
            paramType: { kind: 'boolean' },
            optional: true,
            defaultValue: 'true',
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
  });

  it('should report wrong default value for enum param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'mode',
            paramType: { kind: 'enum', options: ['dev', 'prod'] },
            optional: true,
            defaultValue: 'staging',
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
  });

  it('should report optional param without default', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'optional',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: undefined,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('no default value');
  });

  it('should pass for optional param with valid default', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'optional',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: 'default value',
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should pass for required param without default', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'required',
            paramType: { kind: 'string' },
            optional: false,
            defaultValue: undefined,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should validate multiple params with mixed issues', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'dup',
            paramType: { kind: 'string' },
            optional: false,
            loc,
          },
          {
            type: 'ParamDefinition',
            name: 'dup',
            paramType: { kind: 'string' },
            optional: false,
            loc,
          },
          {
            type: 'ParamDefinition',
            name: 'wrongType',
            paramType: { kind: 'number' },
            optional: true,
            defaultValue: 'string',
            loc,
          },
          {
            type: 'ParamDefinition',
            name: 'noDefault',
            paramType: { kind: 'boolean' },
            optional: true,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(3); // duplicate + wrong type + no default
  });

  it('should handle null default value', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'nullable',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: null,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
  });

  it('should handle array default value', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'list',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: ['a', 'b'],
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
  });

  it('should handle TextContent default value for string param', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'text',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: { type: 'TextContent', value: 'hello', loc },
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0); // TextContent counts as string
  });

  it('should handle TemplateExpression default value', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'template',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: { type: 'TemplateExpression', name: 'var', loc },
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
  });

  it('should handle TypeExpression default value', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'typed',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: { type: 'TypeExpression', kind: 'string', loc } as Value,
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
  });

  it('should handle object default value', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'obj',
            paramType: { kind: 'string' },
            optional: true,
            defaultValue: { key: 'value' },
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(1);
    expect(messages[0]!.message).toContain('wrong type');
  });

  it('should pass for enum with valid string default', () => {
    const ast = createTestProgram({
      meta: {
        type: 'MetaBlock',
        loc,
        fields: { id: 'test' },
        params: [
          {
            type: 'ParamDefinition',
            name: 'mode',
            paramType: { kind: 'enum', options: ['dev', 'prod', 'test'] },
            optional: true,
            defaultValue: 'prod',
            loc,
          },
        ],
      },
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });

  it('should handle AST without meta', () => {
    const ast = createTestProgram({
      meta: undefined,
    });
    const { ctx, messages } = createRuleContext(ast);
    validParams.validate(ctx);
    expect(messages).toHaveLength(0);
  });
});
