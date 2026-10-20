import type {
  Block,
  BlockBody,
  BlockContent,
  BlockEntry,
  ExtendBlock,
  InlineUseDeclaration,
  MetaBlock,
  OverrideBlock,
  ParamArgument,
  ParamDefinition,
  PathReference,
  Program,
} from '@promptscript/core';

const INDENT = '  ';
const IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_-]*$/;
const ENV_VAR = /^\$\{[A-Za-z_]\w*(?::-[^}]*)?\}$/;
// Lexer keywords that cannot be lexed as an Identifier field key.
const KEYWORDS = new Set([
  'meta',
  'inherit',
  'use',
  'as',
  'into',
  'extend',
  'true',
  'false',
  'null',
  'range',
  'enum',
]);

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function quote(value: string): string {
  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r');
  return `"${escaped}"`;
}

function printKey(name: string): string {
  return IDENTIFIER.test(name) && !KEYWORDS.has(name) ? name : quote(name);
}

/** Triple-quoted text; the parser strips the common indent and trims, so any indent is safe. */
function printText(text: string, closeIndent: string): string {
  const body = text
    .split('\n')
    .map((line) => (line.trim() === '' ? '' : closeIndent + INDENT + line))
    .join('\n');
  return `"""\n${body}\n${closeIndent}"""`;
}

function printList(items: string[], open: string, close: string, indent: string): string {
  if (items.length === 0) return `${open}${close}`;
  const inner = indent + INDENT;
  return `${open}\n${items.map((item) => inner + item).join('\n')}\n${indent}${close}`;
}

function printTypeExpression(expr: Dict): string {
  const kind = str(expr['kind']);
  const constraints = isDict(expr['constraints']) ? expr['constraints'] : {};
  if (kind === 'range')
    return `range(${String(constraints['min'])}..${String(constraints['max'])})`;
  if (kind === 'enum') {
    const options = Array.isArray(constraints['options']) ? constraints['options'] : [];
    return `enum(${options.map((option) => quote(str(option))).join(', ')})`;
  }
  return kind;
}

/**
 * Print a raw `Value` or a canonical `ValueNode`. Both are accepted because the
 * canonical body carries the same information as the legacy projection.
 */
function printValue(value: unknown, indent: string): string {
  if (typeof value === 'string') return ENV_VAR.test(value) ? value : quote(value);
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (Array.isArray(value)) return printArray(value, indent);
  if (!isDict(value)) throw new Error(`Cannot print value of type ${typeof value}`);

  switch (value['type']) {
    case 'ScalarValueNode':
      return printValue(value['value'], indent);
    case 'TextValueNode':
    case 'TextContent':
      return printText(str(value['value']), indent);
    case 'TemplateValueNode':
    case 'TemplateExpression':
      return `{{${str(value['name'])}}}`;
    case 'TypeExpressionValueNode':
      return printValue(value['expression'], indent);
    case 'TypeExpression':
      return printTypeExpression(value);
    case 'ArrayValueNode': {
      const elements = Array.isArray(value['elements']) ? value['elements'] : [];
      return printArray(
        elements.map((element) => (isDict(element) ? element['value'] : element)),
        indent
      );
    }
    case 'ObjectValueNode': {
      const fields = Array.isArray(value['fields']) ? value['fields'] : [];
      const lines = fields.map(
        (field) =>
          `${printKey(isDict(field) ? str(field['name']) : '')}: ${printValue(isDict(field) ? field['value'] : undefined, indent + INDENT)}`
      );
      return printList(lines, '{', '}', indent);
    }
    default: {
      const lines = Object.entries(value).map(
        ([key, entry]) => `${printKey(key)}: ${printValue(entry, indent + INDENT)}`
      );
      return printList(lines, '{', '}', indent);
    }
  }
}

function printArray(items: unknown[], indent: string): string {
  const printed = items.map((item) => printValue(item, indent + INDENT));
  // Arrays need commas, so keep the simple case on one line and only break for nested values.
  if (printed.every((item) => !item.includes('\n'))) return `[${printed.join(', ')}]`;
  return printList(
    printed.map((item, index) => (index < printed.length - 1 ? `${item},` : item)),
    '[',
    ']',
    indent
  );
}

function printParams(params: ParamArgument[] | undefined): string {
  if (!params) return '';
  return `(${params.map((param) => `${param.name}: ${printValue(param.value, '')}`).join(', ')})`;
}

function printPath(path: PathReference): string {
  return path.raw;
}

interface ImportLike {
  path: PathReference;
  params?: ParamArgument[];
  alias?: string;
  outputDir?: string;
}

function printUse(keyword: string, decl: ImportLike, inherit = false): string {
  const parts = [`@${keyword} ${printPath(decl.path)}${printParams(decl.params)}`];
  if (!inherit) {
    if (decl.alias) parts.push(`as ${decl.alias}`);
    if (decl.outputDir) parts.push(`into ${quote(decl.outputDir)}`);
  }
  return parts.join(' ');
}

function printParamDefinition(def: ParamDefinition, indent: string): string {
  const type =
    def.paramType.kind === 'enum'
      ? `enum(${def.paramType.options.map(quote).join(', ')})`
      : def.paramType.kind;
  const hasDefault = def.defaultValue !== undefined;
  const optional = def.optional && !hasDefault ? '?' : '';
  const fallback = hasDefault ? ` = ${printValue(def.defaultValue, indent)}` : '';
  return `${def.name}${optional}: ${type}${fallback}`;
}

function printMeta(meta: MetaBlock): string {
  const lines = Object.entries(meta.fields).map(
    ([key, value]) => `${printKey(key)}: ${printValue(value, INDENT)}`
  );
  if (meta.params) {
    const defs = meta.params.map((def) => printParamDefinition(def, INDENT + INDENT));
    lines.push(`params: ${printList(defs, '{', '}', INDENT)}`);
  }
  return `@meta ${printList(lines, '{', '}', '')}`;
}

/** Build ordered entries from the legacy projection when no canonical body was retained. */
function entriesFromContent(content: BlockContent): readonly Dict[] {
  switch (content.type) {
    case 'TextContent':
      return [{ type: 'TextEntry', text: content.value }];
    case 'ArrayContent':
      return content.elements.map((value) => ({ type: 'ListEntry', value }));
    case 'ObjectContent':
    case 'MixedContent': {
      const text = content.type === 'MixedContent' && content.text ? [content.text.value] : [];
      return [
        ...text.map((value) => ({ type: 'TextEntry', text: value })),
        ...Object.entries(content.properties).map(([name, value]) => ({
          type: 'FieldEntry',
          name,
          value,
        })),
        ...(content.listItems ?? []).map((value) => ({ type: 'ListEntry', value })),
        ...(content.inlineUses ?? []).map((declaration) => ({
          type: 'InlineUseEntry',
          declaration,
        })),
      ];
    }
  }
}

function printEntry(
  entry: Dict,
  indent: string,
  replaced: ReadonlySet<string>,
  legacyRemainder = ''
): string[] {
  switch (entry['type']) {
    case 'TextEntry':
      return [indent + printText(str(entry['text']), indent)];
    case 'FieldEntry': {
      const name = str(entry['name']);
      const marker = entry['optional'] === true ? '?' : replaced.has(name) ? '!' : '';
      const fallback =
        entry['defaultValue'] === undefined
          ? ''
          : ` = ${printValue(entry['defaultValue'], indent)}`;
      return [
        `${indent}${printKey(name)}${marker}: ${printValue(entry['value'], indent)}${fallback}`,
      ];
    }
    case 'ListEntry':
      return [`${indent}- ${printValue(entry['value'], indent)}`];
    case 'InlineUseEntry': {
      const declaration = entry['declaration'] as InlineUseDeclaration;
      return [indent + printUse('use', declaration)];
    }
    case 'PresentationEntry': {
      const title = str(entry['title']);
      if (entry['source'] === 'legacy') {
        // A legacy heading is the first line of a text block, so it is printed as text.
        return [indent + printText(`## ${title}\n${legacyRemainder}`, indent)];
      }
      const section = typeof entry['sectionId'] === 'string' ? `${entry['sectionId']} ` : '';
      return [`${indent}@header ${section}${quote(title)}`];
    }
    default:
      throw new Error(`Unknown block entry type: ${String(entry['type'])}`);
  }
}

function printBody(
  body: BlockBody | undefined,
  content: BlockContent,
  indent: string,
  replaced: ReadonlySet<string> = new Set()
): string[] {
  const entries: readonly (BlockEntry | Dict)[] = body ? body.entries : entriesFromContent(content);
  return printEntries(entries as readonly Dict[], indent, replaced);
}

/** Print entries in order, folding a legacy heading and the text after it back into one block. */
function printEntries(
  entries: readonly Dict[],
  indent: string,
  replaced: ReadonlySet<string>
): string[] {
  return entries.flatMap((entry, index) => {
    const previous = entries[index - 1];
    if (previous?.['type'] === 'PresentationEntry' && previous['source'] === 'legacy') {
      return entry['type'] === 'TextEntry' ? [] : printEntry(entry, indent, replaced);
    }
    const next = entries[index + 1];
    const remainder =
      entry['source'] === 'legacy' && next?.['type'] === 'TextEntry' ? str(next['text']) : '';
    return printEntry(entry, indent, replaced, remainder);
  });
}

function printBlockLike(
  head: string,
  body: BlockBody | undefined,
  content: BlockContent,
  replaced?: ReadonlySet<string>
): string {
  const lines = printBody(body, content, INDENT, replaced);
  return lines.length === 0 ? `${head} {\n}` : `${head} {\n${lines.join('\n')}\n}`;
}

function printBlock(block: Block): string {
  return printBlockLike(`@${block.name}`, block.canonicalBody, block.content);
}

function printExtend(block: ExtendBlock): string {
  const replaced = new Set((block.replacements ?? []).map((replacement) => replacement.property));
  return printBlockLike(
    `@extend ${block.targetPath}`,
    block.canonicalBody,
    block.content,
    replaced
  );
}

function printOverride(block: OverrideBlock): string {
  const head = `@override ${block.targetPath}`;
  const { replacement } = block;
  if (replacement.type === 'BlockReplacement') {
    const lines = printEntries(replacement.body.entries as unknown as Dict[], INDENT, new Set());
    return `${head} {\n${lines.join('\n')}\n}`;
  }
  return `${head} {\n${INDENT}${printValue(replacement.value, INDENT)}\n}`;
}

/**
 * Print a parsed program as canonical `.prs` source (2-space indent).
 *
 * Comments are not part of the AST and are not printed. Top-level declarations
 * are emitted grouped by kind (meta, inherit, uses, blocks, extends, overrides)
 * because the legacy AST does not retain their interleaved order.
 */
export function printProgram(ast: Program): string {
  const sections: string[] = [];
  if (ast.meta) sections.push(printMeta(ast.meta));
  if (ast.inherit) sections.push(printUse('inherit', ast.inherit, true));
  sections.push(...ast.uses.map((use) => printUse('use', use)));
  sections.push(...ast.blocks.map(printBlock));
  sections.push(...ast.extends.map(printExtend));
  sections.push(...(ast.overrides ?? []).map(printOverride));
  return sections.join('\n\n') + '\n';
}
