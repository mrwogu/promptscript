import type { RuleContext, ValidationRule } from '../types.js';
import type { ParamType, TypeExpression, Value, ValueNode } from '@promptscript/core';
import { valueNodeToValue } from '@promptscript/core';

/**
 * Get the string representation of a ParamType.
 */
function paramTypeToString(paramType: ParamType): string {
  switch (paramType.kind) {
    case 'string':
      return 'string';
    case 'number':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'enum':
      return `enum(${paramType.options.map((o) => `"${o}"`).join(', ')})`;
  }
}

/**
 * Get the type of a value.
 */
function getValueType(value: Value): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object' && 'type' in value) {
    const typed = value as { type: string };
    if (typed.type === 'TextContent') return 'string';
    if (typed.type === 'TemplateExpression') return 'template';
    if (typed.type === 'TypeExpression') return 'type';
  }
  return 'object';
}

/**
 * Check if a value matches the expected param type.
 */
function valueMatchesType(value: Value, paramType: ParamType): boolean {
  const actualType = getValueType(value);

  switch (paramType.kind) {
    case 'string':
      return actualType === 'string';
    case 'number':
      return actualType === 'number';
    case 'boolean':
      return actualType === 'boolean';
    case 'enum':
      return actualType === 'string' && paramType.options.includes(value as string);
  }
}

/**
 * Render a type expression the way it is written in source.
 */
function typeExpressionToString(expression: TypeExpression): string {
  switch (expression.kind) {
    case 'enum': {
      const options = expression.constraints?.options ?? [];
      return `enum(${options.map((option) => JSON.stringify(option)).join(', ')})`;
    }
    case 'range': {
      const { min, max } = expression.constraints ?? {};
      if (min === undefined || max === undefined) return 'range';
      return `range(${min}, ${max})`;
    }
    default:
      return expression.kind;
  }
}

/**
 * Describe why a default value does not satisfy a type expression.
 * @returns Problem description, or undefined when the value is valid
 */
function describeTypeExpressionMismatch(
  value: Value,
  expression: TypeExpression
): string | undefined {
  const actualType = getValueType(value);

  switch (expression.kind) {
    case 'string':
    case 'number':
    case 'boolean':
      return actualType === expression.kind
        ? undefined
        : `expected ${expression.kind}, got ${actualType}`;
    case 'list':
      return actualType === 'array' ? undefined : `expected a list, got ${actualType}`;
    case 'enum': {
      const options = expression.constraints?.options ?? [];
      if (options.length === 0) return undefined;
      return options.includes(value)
        ? undefined
        : `expected one of ${options.map((option) => JSON.stringify(option)).join(', ')}`;
    }
    case 'range': {
      if (actualType !== 'number') return `expected number, got ${actualType}`;
      const { min, max } = expression.constraints ?? {};
      const numeric = value as number;
      if (min !== undefined && numeric < min) return `expected a value of at least ${min}`;
      if (max !== undefined && numeric > max) return `expected a value of at most ${max}`;
      return undefined;
    }
  }
}

/**
 * Read the type expression a canonical field declares, when it declares one.
 */
function typeExpressionOf(node: ValueNode): TypeExpression | undefined {
  return node.type === 'TypeExpressionValueNode' ? (node.expression as TypeExpression) : undefined;
}

/**
 * PS009: Valid parameter definitions
 *
 * Validates:
 * - No duplicate parameter names
 * - Default values match declared types
 * - Optional parameters with defaults are consistent
 * - Default values of typed block fields match their declared types
 */
export const validParams: ValidationRule = {
  id: 'PS009',
  name: 'valid-params',
  description: 'Validate parameter definitions in @meta and typed block fields',
  defaultSeverity: 'error',
  validate: (ctx) => {
    validateMetaParams(ctx);
    validateTypedFieldDefaults(ctx);
  },
};

/**
 * Validate the parameter list declared in @meta.
 */
function validateMetaParams(ctx: RuleContext): void {
  const params = ctx.ast.meta?.params;
  if (!params || params.length === 0) {
    return;
  }

  // Check for duplicate parameter names
  const seen = new Set<string>();
  for (const param of params) {
    if (seen.has(param.name)) {
      ctx.report({
        message: `Duplicate parameter definition: '${param.name}'`,
        location: param.loc,
        suggestion: 'Remove the duplicate parameter definition',
      });
    }
    seen.add(param.name);
  }

  // Validate default values match their types
  for (const param of params) {
    if (param.defaultValue !== undefined) {
      if (!valueMatchesType(param.defaultValue, param.paramType)) {
        const expectedType = paramTypeToString(param.paramType);
        const actualType = getValueType(param.defaultValue);
        ctx.report({
          message: `Default value for '${param.name}' has wrong type: expected ${expectedType}, got ${actualType}`,
          location: param.loc,
          suggestion: `Change the default value to a ${expectedType}`,
        });
      }
    }
  }

  // Warn about optional params without defaults (they'll be undefined at runtime)
  for (const param of params) {
    if (param.optional && param.defaultValue === undefined) {
      // This is just a warning since it might be intentional
      ctx.report({
        message: `Optional parameter '${param.name}' has no default value`,
        location: param.loc,
        suggestion: 'Consider adding a default value or marking as required',
      });
    }
  }
}

/**
 * Validate defaults written on typed block fields, such as @params entries.
 */
function validateTypedFieldDefaults(ctx: RuleContext): void {
  for (const block of ctx.ast.blocks) {
    for (const entry of block.canonicalBody?.entries ?? []) {
      if (entry.type !== 'FieldEntry' || entry.defaultValue === undefined) continue;

      const expression = typeExpressionOf(entry.value);
      if (!expression) continue;

      const problem = describeTypeExpressionMismatch(
        valueNodeToValue(entry.defaultValue),
        expression
      );
      if (!problem) continue;

      ctx.report({
        message: `Default value for '${entry.name}' does not match its type: ${problem}`,
        location: entry.defaultValue.loc,
        suggestion: `Change the default value to match ${typeExpressionToString(expression)}`,
      });
    }
  }
}
