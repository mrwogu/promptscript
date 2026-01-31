/**
 * Tests for template interpolation engine.
 */
import { describe, it, expect } from 'vitest';
import type {
  ParamDefinition,
  ParamArgument,
  Program,
  TextContent,
  ObjectContent,
  TemplateExpression,
} from '@promptscript/core';
import {
  MissingParamError,
  UnknownParamError,
  ParamTypeMismatchError,
  UndefinedVariableError,
} from '@promptscript/core';
import {
  bindParams,
  interpolateText,
  interpolateContent,
  interpolateAST,
  isTemplateExpression,
  type TemplateContext,
} from '../template.js';

// Helper to create a location
const loc = { file: 'test.prs', line: 1, column: 1 };

// Helper to create a param definition
function makeDef(
  name: string,
  kind: 'string' | 'number' | 'boolean' | 'enum',
  options?: { optional?: boolean; defaultValue?: string | number | boolean; enumOptions?: string[] }
): ParamDefinition {
  return {
    type: 'ParamDefinition',
    name,
    paramType: kind === 'enum' ? { kind: 'enum', options: options?.enumOptions ?? [] } : { kind },
    optional: options?.optional ?? false,
    defaultValue: options?.defaultValue,
    loc,
  };
}

// Helper to create a param argument
function makeArg(name: string, value: unknown): ParamArgument {
  return {
    type: 'ParamArgument',
    name,
    value: value as ParamArgument['value'],
    loc,
  };
}

describe('template', () => {
  describe('isTemplateExpression', () => {
    it('should return true for TemplateExpression', () => {
      const expr: TemplateExpression = { type: 'TemplateExpression', name: 'var', loc };
      expect(isTemplateExpression(expr)).toBe(true);
    });

    it('should return false for non-TemplateExpression', () => {
      expect(isTemplateExpression('string')).toBe(false);
      expect(isTemplateExpression(null)).toBe(false);
      expect(isTemplateExpression({ type: 'TextContent' })).toBe(false);
    });
  });

  describe('bindParams', () => {
    it('should return empty map when no definitions', () => {
      const result = bindParams(undefined, undefined, 'test.prs');
      expect(result.size).toBe(0);
    });

    it('should return empty map when definitions but no args and all optional', () => {
      const defs = [makeDef('name', 'string', { optional: true, defaultValue: 'default' })];
      const result = bindParams(undefined, defs, 'test.prs');
      expect(result.size).toBe(1);
      expect(result.get('name')).toBe('default');
    });

    it('should bind string param', () => {
      const defs = [makeDef('name', 'string')];
      const args = [makeArg('name', 'value')];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('name')).toBe('value');
    });

    it('should bind number param', () => {
      const defs = [makeDef('count', 'number')];
      const args = [makeArg('count', 42)];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('count')).toBe(42);
    });

    it('should bind boolean param', () => {
      const defs = [makeDef('enabled', 'boolean')];
      const args = [makeArg('enabled', true)];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('enabled')).toBe(true);
    });

    it('should bind enum param', () => {
      const defs = [makeDef('mode', 'enum', { enumOptions: ['dev', 'prod'] })];
      const args = [makeArg('mode', 'dev')];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('mode')).toBe('dev');
    });

    it('should throw MissingParamError for required params', () => {
      const defs = [makeDef('required', 'string')];
      expect(() => bindParams(undefined, defs, 'test.prs')).toThrow(MissingParamError);
    });

    it('should throw UnknownParamError for unknown params', () => {
      const defs = [makeDef('known', 'string')];
      const args = [makeArg('unknown', 'value')];
      expect(() => bindParams(args, defs, 'test.prs')).toThrow(UnknownParamError);
    });

    it('should throw UnknownParamError when args provided but no defs', () => {
      const args = [makeArg('name', 'value')];
      expect(() => bindParams(args, undefined, 'test.prs')).toThrow(UnknownParamError);
    });

    it('should throw ParamTypeMismatchError for wrong type', () => {
      const defs = [makeDef('num', 'number')];
      const args = [makeArg('num', 'not a number')];
      expect(() => bindParams(args, defs, 'test.prs')).toThrow(ParamTypeMismatchError);
    });

    it('should throw ParamTypeMismatchError for invalid enum value', () => {
      const defs = [makeDef('mode', 'enum', { enumOptions: ['dev', 'prod'] })];
      const args = [makeArg('mode', 'staging')];
      expect(() => bindParams(args, defs, 'test.prs')).toThrow(ParamTypeMismatchError);
    });

    it('should apply default values for optional params', () => {
      const defs = [
        makeDef('required', 'string'),
        makeDef('optional', 'string', { optional: true, defaultValue: 'default' }),
      ];
      const args = [makeArg('required', 'value')];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('required')).toBe('value');
      expect(result.get('optional')).toBe('default');
    });
  });

  describe('interpolateText', () => {
    it('should interpolate simple variable', () => {
      const ctx: TemplateContext = {
        params: new Map([['name', 'World']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Hello, {{name}}!', ctx)).toBe('Hello, World!');
    });

    it('should interpolate multiple variables', () => {
      const ctx: TemplateContext = {
        params: new Map([
          ['first', 'John'],
          ['last', 'Doe'],
        ]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('{{first}} {{last}}', ctx)).toBe('John Doe');
    });

    it('should interpolate number as string', () => {
      const ctx: TemplateContext = {
        params: new Map([['count', 42]]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Count: {{count}}', ctx)).toBe('Count: 42');
    });

    it('should interpolate boolean as string', () => {
      const ctx: TemplateContext = {
        params: new Map([['enabled', true]]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Enabled: {{enabled}}', ctx)).toBe('Enabled: true');
    });

    it('should throw UndefinedVariableError for undefined variable', () => {
      const ctx: TemplateContext = {
        params: new Map(),
        sourceFile: 'test.prs',
      };
      expect(() => interpolateText('Hello, {{undefined}}!', ctx)).toThrow(UndefinedVariableError);
    });

    it('should not interpolate malformed patterns', () => {
      const ctx: TemplateContext = {
        params: new Map([['name', 'World']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Hello, {name}!', ctx)).toBe('Hello, {name}!');
      expect(interpolateText('Hello, {{ name }}!', ctx)).toBe('Hello, {{ name }}!');
    });
  });

  describe('interpolateContent', () => {
    it('should interpolate TextContent', () => {
      const ctx: TemplateContext = {
        params: new Map([['name', 'World']]),
        sourceFile: 'test.prs',
      };
      const content: TextContent = {
        type: 'TextContent',
        value: 'Hello, {{name}}!',
        loc,
      };
      const result = interpolateContent(content, ctx) as TextContent;
      expect(result.value).toBe('Hello, World!');
    });

    it('should interpolate ObjectContent with TemplateExpression values', () => {
      const ctx: TemplateContext = {
        params: new Map([['projectName', 'my-app']]),
        sourceFile: 'test.prs',
      };
      const content: ObjectContent = {
        type: 'ObjectContent',
        properties: {
          name: { type: 'TemplateExpression', name: 'projectName', loc } as TemplateExpression,
          version: '1.0.0',
        },
        loc,
      };
      const result = interpolateContent(content, ctx) as ObjectContent;
      expect(result.properties['name']).toBe('my-app');
      expect(result.properties['version']).toBe('1.0.0');
    });

    it('should interpolate nested objects', () => {
      const ctx: TemplateContext = {
        params: new Map([['value', 'interpolated']]),
        sourceFile: 'test.prs',
      };
      const content: ObjectContent = {
        type: 'ObjectContent',
        properties: {
          nested: {
            inner: { type: 'TemplateExpression', name: 'value', loc } as TemplateExpression,
          },
        },
        loc,
      };
      const result = interpolateContent(content, ctx) as ObjectContent;
      expect((result.properties['nested'] as Record<string, unknown>)['inner']).toBe(
        'interpolated'
      );
    });
  });

  describe('interpolateAST', () => {
    it('should return same AST if no params', () => {
      const ctx: TemplateContext = {
        params: new Map(),
        sourceFile: 'test.prs',
      };
      const ast: Program = {
        type: 'Program',
        uses: [],
        blocks: [],
        extends: [],
        loc,
      };
      const result = interpolateAST(ast, ctx);
      expect(result).toBe(ast);
    });

    it('should interpolate meta fields', () => {
      const ctx: TemplateContext = {
        params: new Map([['projectName', 'my-app']]),
        sourceFile: 'test.prs',
      };
      const ast: Program = {
        type: 'Program',
        meta: {
          type: 'MetaBlock',
          fields: {
            id: { type: 'TemplateExpression', name: 'projectName', loc } as TemplateExpression,
          },
          loc,
        },
        uses: [],
        blocks: [],
        extends: [],
        loc,
      };
      const result = interpolateAST(ast, ctx);
      expect(result.meta?.fields['id']).toBe('my-app');
    });

    it('should interpolate block content', () => {
      const ctx: TemplateContext = {
        params: new Map([['name', 'World']]),
        sourceFile: 'test.prs',
      };
      const ast: Program = {
        type: 'Program',
        uses: [],
        blocks: [
          {
            type: 'Block',
            name: 'identity',
            content: {
              type: 'TextContent',
              value: 'Hello, {{name}}!',
              loc,
            },
            loc,
          },
        ],
        extends: [],
        loc,
      };
      const result = interpolateAST(ast, ctx);
      const block = result.blocks[0];
      expect(block).toBeDefined();
      expect((block!.content as TextContent).value).toBe('Hello, World!');
    });

    it('should interpolate extend block content', () => {
      const ctx: TemplateContext = {
        params: new Map([['extra', 'additional info']]),
        sourceFile: 'test.prs',
      };
      const ast: Program = {
        type: 'Program',
        uses: [],
        blocks: [],
        extends: [
          {
            type: 'ExtendBlock',
            targetPath: 'identity',
            content: {
              type: 'TextContent',
              value: 'Extra: {{extra}}',
              loc,
            },
            loc,
          },
        ],
        loc,
      };
      const result = interpolateAST(ast, ctx);
      const extendBlock = result.extends[0];
      expect(extendBlock).toBeDefined();
      expect((extendBlock!.content as TextContent).value).toBe('Extra: additional info');
    });
  });

  describe('security edge cases', () => {
    it('should treat shell injection attempts as literal strings', () => {
      const ctx: TemplateContext = {
        params: new Map([['cmd', '"; rm -rf / #']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Running: {{cmd}}', ctx)).toBe('Running: "; rm -rf / #');
    });

    it('should treat SQL injection attempts as literal strings', () => {
      const ctx: TemplateContext = {
        params: new Map([['input', "'; DROP TABLE users; --"]]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Query: {{input}}', ctx)).toBe("Query: '; DROP TABLE users; --");
    });

    it('should treat script tags as literal strings', () => {
      const ctx: TemplateContext = {
        params: new Map([['content', '<script>alert("xss")</script>']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Content: {{content}}', ctx)).toBe(
        'Content: <script>alert("xss")</script>'
      );
    });

    it('should treat template expressions in values as literal strings (no double interpolation)', () => {
      const ctx: TemplateContext = {
        params: new Map([['value', '{{nested}}']]),
        sourceFile: 'test.prs',
      };
      // The value {{nested}} should NOT be interpolated again
      expect(interpolateText('Value: {{value}}', ctx)).toBe('Value: {{nested}}');
    });

    it('should handle unicode and special characters safely', () => {
      const ctx: TemplateContext = {
        params: new Map([['emoji', '🚀 Hello 世界']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Message: {{emoji}}', ctx)).toBe('Message: 🚀 Hello 世界');
    });

    it('should handle newlines in values', () => {
      const ctx: TemplateContext = {
        params: new Map([['multiline', 'line1\nline2\nline3']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Content:\n{{multiline}}', ctx)).toBe('Content:\nline1\nline2\nline3');
    });

    it('should handle very long strings', () => {
      const longString = 'a'.repeat(10000);
      const ctx: TemplateContext = {
        params: new Map([['long', longString]]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('{{long}}', ctx)).toBe(longString);
    });

    it('should handle empty string values', () => {
      const ctx: TemplateContext = {
        params: new Map([['empty', '']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Value: {{empty}}', ctx)).toBe('Value: ');
    });

    it('should not interpret backslashes specially', () => {
      const ctx: TemplateContext = {
        params: new Map([['path', 'C:\\Users\\Admin']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Path: {{path}}', ctx)).toBe('Path: C:\\Users\\Admin');
    });
  });

  describe('edge cases for variable names', () => {
    it('should handle underscore-prefixed variable names', () => {
      const ctx: TemplateContext = {
        params: new Map([['_private', 'secret']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Value: {{_private}}', ctx)).toBe('Value: secret');
    });

    it('should handle variable names with numbers', () => {
      const ctx: TemplateContext = {
        params: new Map([['var123', 'numbered']]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('Value: {{var123}}', ctx)).toBe('Value: numbered');
    });

    it('should not interpolate invalid variable name patterns', () => {
      const ctx: TemplateContext = {
        params: new Map([['valid', 'test']]),
        sourceFile: 'test.prs',
      };
      // These should be left as-is because they don't match the pattern
      expect(interpolateText('{{123abc}}', ctx)).toBe('{{123abc}}');
      expect(interpolateText('{{a-b}}', ctx)).toBe('{{a-b}}');
      expect(interpolateText('{{a.b}}', ctx)).toBe('{{a.b}}');
    });

    it('should handle adjacent template expressions', () => {
      const ctx: TemplateContext = {
        params: new Map([
          ['a', 'first'],
          ['b', 'second'],
        ]),
        sourceFile: 'test.prs',
      };
      expect(interpolateText('{{a}}{{b}}', ctx)).toBe('firstsecond');
    });
  });

  describe('param binding edge cases', () => {
    it('should handle empty params list', () => {
      const defs = [makeDef('name', 'string', { optional: true, defaultValue: 'default' })];
      const args: ParamArgument[] = [];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('name')).toBe('default');
    });

    it('should handle multiple required params all provided', () => {
      const defs = [makeDef('a', 'string'), makeDef('b', 'number'), makeDef('c', 'boolean')];
      const args = [makeArg('a', 'string'), makeArg('b', 42), makeArg('c', true)];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.size).toBe(3);
      expect(result.get('a')).toBe('string');
      expect(result.get('b')).toBe(42);
      expect(result.get('c')).toBe(true);
    });

    it('should handle mix of required, optional with default, and optional without default', () => {
      const defs = [
        makeDef('required', 'string'),
        makeDef('withDefault', 'number', { optional: true, defaultValue: 10 }),
        makeDef('noDefault', 'boolean', { optional: true }),
      ];
      const args = [makeArg('required', 'value')];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('required')).toBe('value');
      expect(result.get('withDefault')).toBe(10);
      expect(result.has('noDefault')).toBe(false);
    });

    it('should validate boolean false as valid value', () => {
      const defs = [makeDef('flag', 'boolean')];
      const args = [makeArg('flag', false)];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('flag')).toBe(false);
    });

    it('should validate number zero as valid value', () => {
      const defs = [makeDef('count', 'number')];
      const args = [makeArg('count', 0)];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('count')).toBe(0);
    });

    it('should validate negative numbers', () => {
      const defs = [makeDef('offset', 'number')];
      const args = [makeArg('offset', -42)];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('offset')).toBe(-42);
    });

    it('should validate floating point numbers', () => {
      const defs = [makeDef('rate', 'number')];
      const args = [makeArg('rate', 3.14159)];
      const result = bindParams(args, defs, 'test.prs');
      expect(result.get('rate')).toBe(3.14159);
    });
  });

  describe('error messages', () => {
    it('should include parameter name in MissingParamError', () => {
      const defs = [makeDef('projectName', 'string')];
      try {
        bindParams(undefined, defs, 'template.prs');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(MissingParamError);
        expect((err as MissingParamError).message).toContain('projectName');
        expect((err as MissingParamError).message).toContain('template.prs');
      }
    });

    it('should include available params in UnknownParamError', () => {
      const defs = [makeDef('name', 'string'), makeDef('age', 'number')];
      const args = [makeArg('typo', 'value')];
      try {
        bindParams(args, defs, 'template.prs');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(UnknownParamError);
        expect((err as UnknownParamError).message).toContain('typo');
        expect((err as UnknownParamError).message).toContain('name');
        expect((err as UnknownParamError).message).toContain('age');
      }
    });

    it('should include expected and actual types in ParamTypeMismatchError', () => {
      const defs = [makeDef('count', 'number')];
      const args = [makeArg('count', 'not-a-number')];
      try {
        bindParams(args, defs, 'template.prs');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ParamTypeMismatchError);
        expect((err as ParamTypeMismatchError).message).toContain('count');
        expect((err as ParamTypeMismatchError).message).toContain('number');
        expect((err as ParamTypeMismatchError).message).toContain('string');
      }
    });

    it('should include variable name in UndefinedVariableError', () => {
      const ctx: TemplateContext = {
        params: new Map(),
        sourceFile: 'test.prs',
      };
      try {
        interpolateText('Hello {{missingVar}}', ctx);
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(UndefinedVariableError);
        expect((err as UndefinedVariableError).message).toContain('missingVar');
        expect((err as UndefinedVariableError).message).toContain('test.prs');
      }
    });
  });
});
