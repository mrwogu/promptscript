import type {
  Program,
  ParamDefinition,
  ParamArgument,
  ParamType,
  Value,
  Block,
  BlockContent,
  TextContent,
  TemplateExpression,
  SourceLocation,
} from '@promptscript/core';
import {
  MissingParamError,
  UnknownParamError,
  ParamTypeMismatchError,
  UndefinedVariableError,
} from '@promptscript/core';

/**
 * Context for template interpolation.
 */
export interface TemplateContext {
  /** Bound parameter values */
  params: Map<string, Value>;
  /** Source file being interpolated (for error messages) */
  sourceFile: string;
}

/**
 * Type guard to check if a value is a TemplateExpression.
 */
export function isTemplateExpression(value: unknown): value is TemplateExpression {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type: string }).type === 'TemplateExpression'
  );
}

/**
 * Get the string representation of a ParamType for error messages.
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
 * Get the type name of a value.
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
  }
  return 'object';
}

/**
 * Validate that a value matches the expected parameter type.
 */
function validateParamType(
  paramName: string,
  value: Value,
  expectedType: ParamType,
  location?: SourceLocation
): void {
  const actualType = getValueType(value);

  switch (expectedType.kind) {
    case 'string':
      if (actualType !== 'string') {
        throw new ParamTypeMismatchError(paramName, 'string', actualType, { location });
      }
      break;

    case 'number':
      if (actualType !== 'number') {
        throw new ParamTypeMismatchError(paramName, 'number', actualType, { location });
      }
      break;

    case 'boolean':
      if (actualType !== 'boolean') {
        throw new ParamTypeMismatchError(paramName, 'boolean', actualType, { location });
      }
      break;

    case 'enum':
      if (actualType !== 'string' || !expectedType.options.includes(value as string)) {
        const expected = paramTypeToString(expectedType);
        throw new ParamTypeMismatchError(paramName, expected, String(value), { location });
      }
      break;
  }
}

/**
 * Bind parameter arguments to parameter definitions.
 *
 * @param args - Arguments provided at the call site
 * @param defs - Parameter definitions from the template
 * @param templatePath - Path to the template file (for error messages)
 * @param callLocation - Location of the @inherit/@use call (for error messages)
 * @returns Map of parameter names to their bound values
 * @throws MissingParamError if a required parameter is not provided
 * @throws UnknownParamError if an unknown parameter is provided
 * @throws ParamTypeMismatchError if a parameter value has the wrong type
 */
export function bindParams(
  args: ParamArgument[] | undefined,
  defs: ParamDefinition[] | undefined,
  templatePath: string,
  callLocation?: SourceLocation
): Map<string, Value> {
  const result = new Map<string, Value>();

  // If no definitions, no params allowed
  if (!defs || defs.length === 0) {
    if (args && args.length > 0 && args[0] !== undefined) {
      throw new UnknownParamError(args[0].name, templatePath, [], { location: callLocation });
    }
    return result;
  }

  // Build a map of definitions for quick lookup
  const defMap = new Map<string, ParamDefinition>();
  for (const def of defs) {
    defMap.set(def.name, def);
  }

  // Process provided arguments
  const providedNames = new Set<string>();
  if (args) {
    for (const arg of args) {
      const def = defMap.get(arg.name);
      if (!def) {
        throw new UnknownParamError(
          arg.name,
          templatePath,
          defs.map((d) => d.name),
          { location: arg.loc }
        );
      }

      // Validate type
      validateParamType(arg.name, arg.value, def.paramType, arg.loc);

      result.set(arg.name, arg.value);
      providedNames.add(arg.name);
    }
  }

  // Check for missing required parameters and apply defaults
  for (const def of defs) {
    if (!providedNames.has(def.name)) {
      if (def.defaultValue !== undefined) {
        result.set(def.name, def.defaultValue);
      } else if (!def.optional) {
        throw new MissingParamError(def.name, templatePath, { location: callLocation });
      }
    }
  }

  return result;
}

/**
 * Convert a Value to a string for interpolation into text.
 */
function valueToString(value: Value): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object' && 'type' in value) {
    const typed = value as { type: string };
    if (typed.type === 'TextContent') {
      return (value as TextContent).value;
    }
  }
  return JSON.stringify(value);
}

/**
 * Interpolate template variables in a text string.
 *
 * @param text - Text containing {{variable}} placeholders
 * @param ctx - Template context with bound parameters
 * @returns Interpolated text
 * @throws UndefinedVariableError if a variable is used but not defined
 */
export function interpolateText(text: string, ctx: TemplateContext): string {
  // Match {{variable}} patterns
  const pattern = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

  return text.replace(pattern, (match, varName: string) => {
    const value = ctx.params.get(varName);
    if (value === undefined) {
      throw new UndefinedVariableError(varName, ctx.sourceFile);
    }
    return valueToString(value);
  });
}

/**
 * Interpolate a Value, resolving TemplateExpressions.
 */
function interpolateValue(value: Value, ctx: TemplateContext): Value {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((v) => interpolateValue(v, ctx));
  }

  if (typeof value === 'object' && 'type' in value) {
    const typed = value as { type: string };

    if (typed.type === 'TemplateExpression') {
      const expr = value as TemplateExpression;
      const resolved = ctx.params.get(expr.name);
      if (resolved === undefined) {
        throw new UndefinedVariableError(expr.name, ctx.sourceFile, { location: expr.loc });
      }
      return resolved;
    }

    if (typed.type === 'TextContent') {
      const text = value as TextContent;
      return {
        ...text,
        value: interpolateText(text.value, ctx),
      };
    }

    if (typed.type === 'TypeExpression') {
      // TypeExpressions don't need interpolation
      return value;
    }
  }

  // Plain object - interpolate all values
  if (typeof value === 'object') {
    const result: Record<string, Value> = {};
    for (const [key, val] of Object.entries(value as Record<string, Value>)) {
      result[key] = interpolateValue(val, ctx);
    }
    return result;
  }

  return value;
}

/**
 * Interpolate block content.
 */
export function interpolateContent(content: BlockContent, ctx: TemplateContext): BlockContent {
  switch (content.type) {
    case 'TextContent':
      return {
        ...content,
        value: interpolateText(content.value, ctx),
      };

    case 'ObjectContent':
      return {
        ...content,
        properties: interpolateProperties(content.properties, ctx),
      };

    case 'ArrayContent':
      return {
        ...content,
        elements: content.elements.map((e) => interpolateValue(e, ctx)),
      };

    case 'MixedContent':
      return {
        ...content,
        text: content.text
          ? { ...content.text, value: interpolateText(content.text.value, ctx) }
          : undefined,
        properties: interpolateProperties(content.properties, ctx),
      };
  }
}

/**
 * Interpolate object properties.
 */
function interpolateProperties(
  properties: Record<string, Value>,
  ctx: TemplateContext
): Record<string, Value> {
  const result: Record<string, Value> = {};
  for (const [key, value] of Object.entries(properties)) {
    result[key] = interpolateValue(value, ctx);
  }
  return result;
}

/**
 * Interpolate a block.
 */
function interpolateBlock(block: Block, ctx: TemplateContext): Block {
  return {
    ...block,
    content: interpolateContent(block.content, ctx),
  };
}

/**
 * Interpolate the entire AST with template parameters.
 *
 * @param ast - The AST to interpolate
 * @param ctx - Template context with bound parameters
 * @returns A new AST with all template variables interpolated
 */
export function interpolateAST(ast: Program, ctx: TemplateContext): Program {
  // Skip if no params to interpolate
  if (ctx.params.size === 0) {
    return ast;
  }

  return {
    ...ast,
    // Interpolate meta fields (but not params definitions)
    meta: ast.meta
      ? {
          ...ast.meta,
          fields: interpolateProperties(ast.meta.fields, ctx),
          // Keep params as-is (they're definitions, not values to interpolate)
        }
      : undefined,
    // Interpolate blocks
    blocks: ast.blocks.map((b) => interpolateBlock(b, ctx)),
    // Interpolate extend blocks
    extends: ast.extends.map((e) => ({
      ...e,
      content: interpolateContent(e.content, ctx),
    })),
  };
}
