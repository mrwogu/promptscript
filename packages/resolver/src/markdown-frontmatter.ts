import { ResolveError, splitToolList } from '@promptscript/core';
import type { SourceLocation, Value } from '@promptscript/core';

/**
 * Agent fields copied from a discovered agent file as they are.
 * `description`, `tools` and `targets` have their own handling.
 */
const AGENT_STRING_FIELDS = [
  'model',
  'reasoningEffort',
  'specModel',
  'specReasoningEffort',
  'permissionMode',
  'memory',
  'isolation',
] as const;
const AGENT_LIST_FIELDS = ['disallowedTools', 'skills', 'mcpServers'] as const;
const AGENT_TARGET_FIELDS = ['tools', 'disallowedTools', 'model', 'reasoningEffort'] as const;

function fileLocation(file: string): SourceLocation {
  return { file, line: 1, column: 1, offset: 0 };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Read a tool list field. Accepts a YAML list or a comma separated string.
 * A single name without commas stays a string, because Factory uses it for
 * tool categories such as `read-only`.
 *
 * @throws ResolveError when the value is not a string or a list of strings
 * @internal
 */
export function readToolsField(
  value: unknown,
  field: string,
  sourceFile: string
): string | string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    if (!trimmed.includes(',')) return trimmed;
    return splitToolList(trimmed);
  }
  if (Array.isArray(value)) {
    const items: string[] = [];
    for (const item of value) {
      if (typeof item !== 'string') {
        throw new ResolveError(
          `${field} must be a list of tool names, found ${JSON.stringify(item)}`,
          fileLocation(sourceFile)
        );
      }
      if (item.trim() !== '') items.push(item.trim());
    }
    return items;
  }
  throw new ResolveError(
    `${field} must be a list of tool names or a comma separated string, found ${JSON.stringify(value)}`,
    fileLocation(sourceFile)
  );
}

function readStringField(value: unknown, field: string, sourceFile: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim() === '' ? undefined : value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  throw new ResolveError(
    `${field} must be a string, found ${JSON.stringify(value)}`,
    fileLocation(sourceFile)
  );
}

function readListField(value: unknown, field: string, sourceFile: string): string[] | undefined {
  const tools = readToolsField(value, field, sourceFile);
  if (tools === undefined) return undefined;
  return typeof tools === 'string' ? [tools] : tools;
}

function readTargetOverrides(
  value: unknown,
  sourceFile: string
): Record<string, Value> | undefined {
  if (value === undefined || value === null) return undefined;
  if (!isRecord(value)) {
    throw new ResolveError(
      `targets must be a mapping of target name to overrides, found ${JSON.stringify(value)}`,
      fileLocation(sourceFile)
    );
  }
  const result: Record<string, Value> = {};
  for (const [target, overrides] of Object.entries(value)) {
    result[target] = readTargetEntry(target, overrides, sourceFile);
  }
  return result;
}

function readTargetEntry(
  target: string,
  overrides: unknown,
  sourceFile: string
): Record<string, Value> {
  if (!isRecord(overrides)) {
    throw new ResolveError(
      `targets.${target} must be a mapping, found ${JSON.stringify(overrides)}`,
      fileLocation(sourceFile)
    );
  }
  const entry: Record<string, Value> = {};
  for (const field of AGENT_TARGET_FIELDS) {
    if (!(field in overrides)) continue;
    const raw = overrides[field];
    const parsed =
      field === 'tools' || field === 'disallowedTools'
        ? readToolsField(raw, `targets.${target}.${field}`, sourceFile)
        : readStringField(raw, `targets.${target}.${field}`, sourceFile);
    if (parsed !== undefined) entry[field] = parsed;
  }
  return entry;
}

/**
 * Build agent properties from parsed frontmatter fields. `description`,
 * `tools` and `targets` are validated; other known fields are copied.
 *
 * @internal
 */
export function agentPropsFromFrontmatter(
  fields: Record<string, unknown>,
  sourceFile: string
): Record<string, Value> {
  const props: Record<string, Value> = {};
  const description = readStringField(fields['description'], 'description', sourceFile);
  if (description !== undefined) props['description'] = description;

  const tools = readToolsField(fields['tools'], 'tools', sourceFile);
  if (tools !== undefined) props['tools'] = tools;

  for (const field of AGENT_STRING_FIELDS) {
    const value = readStringField(fields[field], field, sourceFile);
    if (value !== undefined) props[field] = value;
  }
  for (const field of AGENT_LIST_FIELDS) {
    const value = readListField(fields[field], field, sourceFile);
    if (value !== undefined) props[field] = value;
  }
  if (typeof fields['maxTurns'] === 'number') props['maxTurns'] = fields['maxTurns'];
  if (fields['background'] === true) props['background'] = true;

  const targets = readTargetOverrides(fields['targets'], sourceFile);
  if (targets !== undefined) props['targets'] = targets;
  return props;
}

/**
 * Build command properties from parsed frontmatter fields.
 *
 * @internal
 */
export function commandPropsFromFrontmatter(
  fields: Record<string, unknown>,
  sourceFile: string
): Record<string, Value> {
  const props: Record<string, Value> = {};
  const description = readStringField(fields['description'], 'description', sourceFile);
  if (description !== undefined) props['description'] = description;
  const argumentHint = readStringField(fields['argument-hint'], 'argument-hint', sourceFile);
  if (argumentHint !== undefined) props['argumentHint'] = argumentHint;
  const allowedTools = readListField(fields['allowed-tools'], 'allowed-tools', sourceFile);
  if (allowedTools !== undefined) props['allowedTools'] = allowedTools;
  const model = readStringField(fields['model'], 'model', sourceFile);
  if (model !== undefined) props['model'] = model;
  return props;
}
