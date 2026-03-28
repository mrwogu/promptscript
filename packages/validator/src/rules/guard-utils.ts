/**
 * Shared AST node detection utilities for guard-related validation rules.
 */

export const AST_NODE_TYPES = new Set([
  'TextContent',
  'ObjectContent',
  'TemplateExpression',
  'TypeExpression',
  'Block',
]);

export function isAstNode(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const typed = value as Record<string, unknown>;
  return typeof typed['type'] === 'string' && AST_NODE_TYPES.has(typed['type'] as string);
}
