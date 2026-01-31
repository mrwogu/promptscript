import type { ValidationRule } from '../types.js';
import type { ParamType, Value } from '@promptscript/core';

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
 * PS009: Valid parameter definitions
 *
 * Validates:
 * - No duplicate parameter names
 * - Default values match declared types
 * - Optional parameters with defaults are consistent
 */
export const validParams: ValidationRule = {
  id: 'PS009',
  name: 'valid-params',
  description: 'Validate parameter definitions in @meta',
  defaultSeverity: 'error',
  validate: (ctx) => {
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
  },
};
