import {
  COMPOSABLE_BLOCKS,
  SECTION_PROFILES,
  type Block,
  type BlockContent,
  type ComposableBlock,
  type Program,
  type PromptDefinition,
  type Value,
} from '@promptscript/core';

/*
 * Composition of a system message for the prompt targets.
 *
 * Every renderer in this file is a copy of the idea behind the coding formatters, not a shared
 * helper. A change that improves the output of a coding target must never move the bytes of a
 * bundle, because bundles are hashed.
 */

/** One block rendered into the system message. */
export interface ComposedSegment {
  /** Block the text came from */
  block: ComposableBlock;
  /** Rendered text, with every `{{` escaped */
  text: string;
}

/** System message of a prompt, with the pieces it was built from. */
export interface ComposedSystemMessage {
  /** The message, undefined when the prompt has neither composed blocks nor its own text */
  text?: string;
  /** Blocks that contributed text, in composition order */
  blocks: ComposedSegment[];
  /** Whether the prompt's own `system` text is part of the message */
  hasOwnText: boolean;
}

/** Replace `\r\n` and `\r` with `\n`. */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

/** Escape every `{{` so a composed block can never carry a live slot. */
export function escapeSlots(text: string): string {
  return text.replace(/\{\{/g, '\\{{');
}

function trimLines(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/[ \t]+$/, ''))
    .join('\n')
    .trim();
}

function dedent(text: string): string {
  const lines = text.split('\n');
  if (lines.length <= 1) return text.trim();
  const indents = lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => /^\s*/.exec(line)?.[0].length ?? 0);
  const margin = indents.length > 0 ? Math.min(...indents) : 0;
  if (margin === 0) return text.trim();
  return [lines[0]?.trim() ?? '', ...lines.slice(1).map((line) => line.slice(margin))]
    .join('\n')
    .trim();
}

function isInternal(name: string): boolean {
  return name.startsWith('__') || name === 'composedFrom';
}

function isNode(value: Value, type: string): value is Value & { type: string; value?: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === type
  );
}

function scalarText(value: Value): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (isNode(value, 'TextContent')) {
    return typeof value.value === 'string' ? dedent(value.value) : '';
  }
  return undefined;
}

function isPlainObject(value: Value): value is Record<string, Value> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !isNode(value, 'TypeExpression') &&
    !isNode(value, 'TemplateExpression')
  );
}

function indented(pad: string, text: string, label: string): string[] {
  const [first = '', ...rest] = text.split('\n');
  return [`${pad}- ${label}${first}`, ...rest.map((line) => `${pad}  ${line}`)];
}

function itemLines(item: Value, depth: number): string[] {
  const pad = '  '.repeat(depth);
  const text = scalarText(item);
  if (text !== undefined) return indented(pad, text, '');
  if (Array.isArray(item)) return item.flatMap((nested) => itemLines(nested, depth + 1));
  if (isPlainObject(item)) {
    return Object.entries(item).flatMap(([key, nested]) => propertyLines(key, nested, depth));
  }
  return [];
}

function propertyLines(key: string, value: Value, depth: number): string[] {
  if (isInternal(key) || value === null || value === undefined) return [];
  const pad = '  '.repeat(depth);
  const text = scalarText(value);
  if (text !== undefined) return indented(pad, text, `${key}: `);
  if (Array.isArray(value)) {
    return [`${pad}- ${key}:`, ...value.flatMap((item) => itemLines(item, depth + 1))];
  }
  if (isPlainObject(value)) {
    const children = Object.entries(value).flatMap(([name, nested]) =>
      propertyLines(name, nested, depth + 1)
    );
    return children.length > 0 ? [`${pad}- ${key}:`, ...children] : [];
  }
  return [];
}

function textLines(text: string, asBullets: boolean): string[] {
  const body = dedent(text);
  if (body.length === 0) return [];
  if (!asBullets) return [body];
  return body
    .split('\n')
    .map((line) => line.trim().replace(/^-\s*/, ''))
    .filter((line) => line.length > 0)
    .map((line) => `- ${line}`);
}

function bodyLines(content: BlockContent, asBullets: boolean): string[] {
  const listed = (items: Value[] | undefined): string[] =>
    (items ?? []).flatMap((item) => itemLines(item, 0));
  // A list merged from several layers is stored under `items`, and renders as a plain list.
  const properties = (record: Record<string, Value>): string[] => {
    const { items, ...rest } = record;
    return [
      ...(Array.isArray(items) ? listed(items) : propertyLines('items', items ?? null, 0)),
      ...Object.entries(rest).flatMap(([key, value]) => propertyLines(key, value, 0)),
    ];
  };
  switch (content.type) {
    case 'TextContent':
      return textLines(content.value, asBullets);
    case 'ArrayContent':
      return listed(content.elements);
    case 'ObjectContent':
      return [...listed(content.listItems), ...properties(content.properties)];
    case 'MixedContent':
      return [
        ...(content.text ? textLines(content.text.value, asBullets) : []),
        ...listed(content.listItems),
        ...properties(content.properties),
      ];
  }
}

function fence(text: string): string {
  const longest = Math.max(0, ...(text.match(/`+/g) ?? []).map((run) => run.length));
  const marks = '`'.repeat(Math.max(3, longest + 1));
  return `${marks}\n${text}\n${marks}`;
}

function field(record: Record<string, Value>, name: string): string {
  const value = record[name];
  if (value === undefined) return '';
  return dedent(scalarText(value) ?? '');
}

function examplesBody(content: BlockContent): string[] {
  const properties =
    content.type === 'ObjectContent' || content.type === 'MixedContent' ? content.properties : {};
  const parts: string[] = [];
  for (const [name, value] of Object.entries(properties)) {
    if (isInternal(name) || !isPlainObject(value)) continue;
    const input = field(value, 'input');
    const output = field(value, 'output');
    if (!input || !output) continue;
    const description = field(value, 'description').replace(/\s*\n\s*/g, ' ');
    parts.push(`### Example: ${name}`);
    if (description) parts.push('', description);
    parts.push('', '**Input:**', '', fence(input), '', '**Output:**', '', fence(output));
  }
  return parts;
}

function findBlock(program: Program, name: string): Block | undefined {
  return program.blocks.find((block) => block.name === name);
}

function renderBlock(block: Block, name: ComposableBlock): string {
  const lines =
    name === 'examples'
      ? examplesBody(block.content)
      : bodyLines(block.content, name === 'restrictions');
  const body = trimLines(normalizeNewlines(lines.join('\n')));
  if (body.length === 0 || name === 'identity') return body;
  const title = SECTION_PROFILES.general.find((section) => section.id === name)?.defaultTitle;
  return `## ${title ?? name}\n\n${body}`;
}

/**
 * Compose the system message of a prompt.
 *
 * With a non-empty `compose`, the message is built from the listed blocks in a fixed order
 * (identity, context, knowledge, standards, restrictions, examples), then the prompt's own
 * `system` text. Order inside `compose` does not matter. Segments are joined with one blank
 * line. Every `{{` in a composed block is escaped, so only the prompt's own text can carry a
 * live slot. Without `compose` the message is the prompt's own text.
 *
 * @param program - The resolved program
 * @param prompt - The prompt definition
 * @returns The message and the blocks it was built from
 */
export function composeSystemMessage(
  program: Program,
  prompt: PromptDefinition
): ComposedSystemMessage {
  const blocks: ComposedSegment[] = [];
  for (const name of COMPOSABLE_BLOCKS) {
    if (!prompt.compose.includes(name)) continue;
    const block = findBlock(program, name);
    const text = block ? renderBlock(block, name) : '';
    if (text.length > 0) blocks.push({ block: name, text: escapeSlots(text) });
  }
  const own = prompt.system === undefined ? undefined : normalizeNewlines(prompt.system);
  const parts = [...blocks.map((segment) => segment.text), ...(own ? [own] : [])];
  return {
    ...(parts.length > 0 ? { text: parts.join('\n\n') } : {}),
    blocks,
    hasOwnText: own !== undefined && own.length > 0,
  };
}
