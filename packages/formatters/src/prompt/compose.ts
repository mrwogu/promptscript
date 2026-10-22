import {
  COMPOSABLE_BLOCKS,
  type Block,
  type BlockContent,
  type ComposableBlock,
  type Program,
  type PromptDefinition,
  type TextContent,
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
  return text.replaceAll(/\r\n?/g, '\n');
}

/** Escape every `{{` so a composed block can never carry a live slot. */
export function escapeSlots(text: string): string {
  return text.replaceAll('{{', String.raw`\{{`);
}

/** Remove trailing spaces and tabs. A loop, because a regex backtracks on a long run. */
function trimTrailingBlanks(line: string): string {
  let end = line.length;
  while (end > 0 && (line[end - 1] === ' ' || line[end - 1] === '\t')) end--;
  return line.slice(0, end);
}

function trimLines(text: string): string {
  return text.split('\n').map(trimTrailingBlanks).join('\n').trim();
}

/** Join the non-empty lines of a text with one space each. */
export function singleLine(text: string): string {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join(' ');
}

function dedent(text: string): string {
  const lines = text.split('\n');
  if (lines.length <= 1) return text.trim();
  const indents = lines
    .slice(1)
    .filter((line) => line.trim().length > 0)
    .map((line) => line.length - line.trimStart().length);
  // Infinity when every continuation line is blank
  const margin = Math.min(...indents);
  if (margin === 0 || margin === Infinity) return text.trim();
  return [
    ...lines.slice(0, 1).map((line) => line.trim()),
    ...lines.slice(1).map((line) => line.slice(margin)),
  ]
    .join('\n')
    .trim();
}

function isInternal(name: string): boolean {
  return name.startsWith('__') || name === 'composedFrom';
}

function isNode(value: Value, type: string): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === type
  );
}

function isTextContent(value: Value): value is TextContent {
  return isNode(value, 'TextContent');
}

function scalarText(value: Value): string | undefined {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (isTextContent(value)) return dedent(value.value);
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
  if (text !== undefined) return text === '' ? [] : indented(pad, text, '');
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
    const merged = Array.isArray(items);
    const others = Object.entries(merged ? rest : record);
    return [
      ...(merged ? listed(items) : []),
      ...others.flatMap(([key, value]) => propertyLines(key, value, 0)),
    ];
  };
  switch (content.type) {
    case 'TextContent':
      return textLines(content.value, asBullets);
    case 'ArrayContent':
      return listed(content.elements);
    case 'ObjectContent':
      return joinGroups([listed(content.listItems), properties(content.properties)]);
    case 'MixedContent':
      return joinGroups([
        content.text ? textLines(content.text.value, asBullets) : [],
        listed(content.listItems),
        properties(content.properties),
      ]);
  }
}

/** Separate the non-empty groups of lines with one blank line. */
function joinGroups(groups: string[][]): string[] {
  return groups
    .filter((group) => group.length > 0)
    .flatMap((group, index) => (index === 0 ? group : ['', ...group]));
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
    const description = singleLine(field(value, 'description'));
    parts.push(`### Example: ${name}`);
    if (description) parts.push('', description);
    parts.push('', '**Input:**', '', fence(input), '', '**Output:**', '', fence(output));
  }
  return parts;
}

/** Headings of the blocks that have one. A test keeps them equal to the general profile. */
const SECTION_TITLES: Record<Exclude<ComposableBlock, 'identity'>, string> = {
  context: 'Context',
  knowledge: 'Knowledge',
  standards: 'Standards',
  restrictions: 'Restrictions',
  examples: 'Examples',
};

function renderBlock(block: Block, name: ComposableBlock): string {
  const lines =
    name === 'examples'
      ? examplesBody(block.content)
      : bodyLines(block.content, name === 'restrictions');
  const body = trimLines(normalizeNewlines(lines.join('\n')));
  if (body.length === 0 || name === 'identity') return body;
  return `## ${SECTION_TITLES[name]}\n\n${body}`;
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
  const blocks: ComposedSegment[] = COMPOSABLE_BLOCKS.filter((name) =>
    prompt.compose.includes(name)
  )
    .flatMap((name) =>
      program.blocks
        .filter((block) => block.name === name)
        .slice(0, 1)
        .map((block) => ({ block: name, text: renderBlock(block, name) }))
    )
    .filter((segment) => segment.text.length > 0)
    .map((segment) => ({ ...segment, text: escapeSlots(segment.text) }));
  const own = normalizeNewlines(prompt.system ?? '');
  const hasOwnText = own.length > 0;
  const parts = [...blocks.map((segment) => segment.text), ...(hasOwnText ? [own] : [])];
  return {
    ...(parts.length > 0 ? { text: parts.join('\n\n') } : {}),
    blocks,
    hasOwnText,
  };
}
