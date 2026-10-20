import { SYNTAX_FEATURES, blockContentToBody } from '@promptscript/core';
import type {
  Block,
  BlockBody,
  BlockContent,
  BlockEntry,
  DeepReadonly,
  ExtendBlock,
  InheritDeclaration,
  InlineUseDeclaration,
  MetaBlock,
  OverrideBlock,
  ParamArgument,
  ParamDefinition,
  PrimitiveValue,
  Program,
  TemplateExpression,
  TextContent,
  TypeExpression,
  UseDeclaration,
  Value,
  ValueNode,
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

interface PrintContext {
  /** Print `${VAR}` strings bare; only safe when the source already used the env-var-value feature. */
  readonly bareEnv: boolean;
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

/**
 * The lexer has no exponent notation, so expand `String(n)` output such as
 * `1e-7` or `1e+21` into plain decimal digits without losing precision.
 */
function printNumber(value: number): string {
  // "Infinity" and "NaN" would reparse as strings, so refuse instead of changing the type.
  if (!Number.isFinite(value)) throw new Error(`Cannot print non-finite number: ${value}`);
  if (Object.is(value, -0)) return '-0';
  const text = String(value);
  const match = /^(-?)(\d+)(?:\.(\d+))?e([+-]\d+)$/.exec(text);
  if (!match) return text;
  const [, sign, whole, fraction = '', exponent] = match;
  const digits = whole + fraction;
  const point = whole!.length + Number(exponent);
  if (point <= 0) return `${sign}0.${'0'.repeat(-point)}${digits}`;
  if (point >= digits.length) return `${sign}${digits}${'0'.repeat(point - digits.length)}`;
  return `${sign}${digits.slice(0, point)}.${digits.slice(point)}`;
}

function printScalar(value: PrimitiveValue, ctx: PrintContext): string {
  if (typeof value === 'string') return ctx.bareEnv && ENV_VAR.test(value) ? value : quote(value);
  if (typeof value === 'number') return printNumber(value);
  return String(value);
}

/** Triple-quoted text; the parser strips the common indent and trims, so any indent is safe. */
function printText(text: string, closeIndent: string): string {
  // Only exactly empty lines stay empty; whitespace-only lines are content and must survive.
  const body = text
    .split('\n')
    .map((line) => (line === '' ? '' : closeIndent + INDENT + line))
    .join('\n');
  return `"""\n${body}\n${closeIndent}"""`;
}

function printList(items: string[], open: string, close: string, indent: string): string {
  if (items.length === 0) return `${open}${close}`;
  const inner = indent + INDENT;
  return `${open}\n${items.map((item) => inner + item).join('\n')}\n${indent}${close}`;
}

function printTypeExpression(expr: DeepReadonly<TypeExpression>): string {
  const { constraints } = expr;
  switch (expr.kind) {
    case 'range':
      return `range(${printNumber(constraints?.min ?? 0)}..${printNumber(constraints?.max ?? 0)})`;
    case 'enum':
      return `enum(${(constraints?.options ?? []).map((option) => quote(String(option))).join(', ')})`;
    case 'list':
    case 'string':
    case 'number':
    case 'boolean':
      return expr.kind;
    default:
      return assertNever(expr.kind);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled node: ${JSON.stringify(value)}`);
}

interface LegacyNodes {
  TextContent: TextContent;
  TemplateExpression: TemplateExpression;
  TypeExpression: TypeExpression;
}

/** Parser nodes always carry `loc`; that tells them apart from user objects with a `type` key. */
function isNode<K extends keyof LegacyNodes>(value: object, type: K): value is LegacyNodes[K] {
  return 'type' in value && value.type === type && 'loc' in value;
}

/** Print a legacy `Value` (meta fields, params, @use arguments). */
function printValue(value: Value | DeepReadonly<Value>, indent: string, ctx: PrintContext): string {
  if (value === null || typeof value !== 'object') return printScalar(value, ctx);
  if (Array.isArray(value))
    return printArray(
      value.map((item) => printValue(item, indent + INDENT, ctx)),
      indent
    );
  if (isNode(value, 'TextContent')) return printText(value.value, indent);
  if (isNode(value, 'TemplateExpression')) return `{{${value.name}}}`;
  if (isNode(value, 'TypeExpression')) return printTypeExpression(value);
  const lines = Object.entries(value).map(
    ([key, entry]) => `${printKey(key)}: ${printValue(entry as Value, indent + INDENT, ctx)}`
  );
  return printList(lines, '{', '}', indent);
}

/** Print a canonical `ValueNode`. */
function printValueNode(node: ValueNode, indent: string, ctx: PrintContext): string {
  switch (node.type) {
    case 'ScalarValueNode':
      return printScalar(node.value, ctx);
    case 'TextValueNode':
      return printText(node.value, indent);
    case 'TemplateValueNode':
      return `{{${node.name}}}`;
    case 'TypeExpressionValueNode':
      return printTypeExpression(node.expression);
    case 'ArrayValueNode':
      return printArray(
        node.elements.map((element) => printValueNode(element.value, indent + INDENT, ctx)),
        indent
      );
    case 'ObjectValueNode':
      return printList(
        node.fields.map(
          (field) => `${printKey(field.name)}: ${printValueNode(field.value, indent + INDENT, ctx)}`
        ),
        '{',
        '}',
        indent
      );
    default:
      return assertNever(node);
  }
}

function printArray(printed: string[], indent: string): string {
  // Arrays need commas, so keep the simple case on one line and only break for nested values.
  if (printed.every((item) => !item.includes('\n'))) return `[${printed.join(', ')}]`;
  return printList(
    printed.map((item, index) => (index < printed.length - 1 ? `${item},` : item)),
    '[',
    ']',
    indent
  );
}

function printParams(params: ParamArgument[] | undefined, ctx: PrintContext): string {
  if (!params) return '';
  return `(${params.map((param) => `${param.name}: ${printValue(param.value, '', ctx)}`).join(', ')})`;
}

function printImport(
  keyword: string,
  decl: InheritDeclaration | UseDeclaration | InlineUseDeclaration,
  ctx: PrintContext
): string {
  return `@${keyword} ${decl.path.raw}${printParams(decl.params, ctx)}`;
}

function printUse(decl: UseDeclaration | InlineUseDeclaration, ctx: PrintContext): string {
  const parts = [printImport('use', decl, ctx)];
  if (decl.alias) parts.push(`as ${decl.alias}`);
  if (decl.outputDir) parts.push(`into ${quote(decl.outputDir)}`);
  return parts.join(' ');
}

function printParamDefinition(def: ParamDefinition, indent: string, ctx: PrintContext): string {
  const type =
    def.paramType.kind === 'enum'
      ? `enum(${def.paramType.options.map(quote).join(', ')})`
      : def.paramType.kind;
  const hasDefault = def.defaultValue !== undefined;
  const optional = def.optional && !hasDefault ? '?' : '';
  const fallback = hasDefault ? ` = ${printValue(def.defaultValue!, indent, ctx)}` : '';
  return `${def.name}${optional}: ${type}${fallback}`;
}

function printMeta(meta: MetaBlock, ctx: PrintContext): string {
  const lines = Object.entries(meta.fields).map(
    ([key, value]) => `${printKey(key)}: ${printValue(value, INDENT, ctx)}`
  );
  if (meta.params) {
    const defs = meta.params.map((def) => printParamDefinition(def, INDENT + INDENT, ctx));
    lines.push(`params: ${printList(defs, '{', '}', INDENT)}`);
  }
  return `@meta ${printList(lines, '{', '}', '')}`;
}

function printEntry(
  entry: BlockEntry,
  indent: string,
  replaced: ReadonlySet<string>,
  ctx: PrintContext,
  legacyRemainder = ''
): string[] {
  switch (entry.type) {
    case 'TextEntry':
      return [indent + printText(entry.text, indent)];
    case 'FieldEntry': {
      const marker = entry.optional ? '?' : replaced.has(entry.name) ? '!' : '';
      const fallback = entry.defaultValue
        ? ` = ${printValueNode(entry.defaultValue, indent, ctx)}`
        : '';
      return [
        `${indent}${printKey(entry.name)}${marker}: ${printValueNode(entry.value, indent, ctx)}${fallback}`,
      ];
    }
    case 'ListEntry': {
      // restrictionItem only accepts a StringLiteral, so a string item must never print bare.
      const { value } = entry;
      const item =
        value.type === 'ScalarValueNode' && typeof value.value === 'string'
          ? quote(value.value)
          : printValueNode(value, indent, ctx);
      return [`${indent}- ${item}`];
    }
    case 'InlineUseEntry':
      return [indent + printUse(entry.declaration as InlineUseDeclaration, ctx)];
    case 'PresentationEntry': {
      if (entry.source === 'legacy') {
        // A legacy heading is the first line of a text block, so it is printed as text.
        return [indent + printText(`## ${entry.title}\n${legacyRemainder}`, indent)];
      }
      const section = entry.sectionId ? `${entry.sectionId} ` : '';
      return [`${indent}@header ${section}${quote(entry.title)}`];
    }
    default:
      return assertNever(entry);
  }
}

/** Print entries in order, folding a legacy heading and the text after it back into one block. */
function printEntries(
  entries: readonly BlockEntry[],
  indent: string,
  replaced: ReadonlySet<string>,
  ctx: PrintContext
): string[] {
  return entries.flatMap((entry, index) => {
    const previous = entries[index - 1];
    if (previous?.type === 'PresentationEntry' && previous.source === 'legacy') {
      return entry.type === 'TextEntry' ? [] : printEntry(entry, indent, replaced, ctx);
    }
    const next = entries[index + 1];
    const remainder =
      entry.type === 'PresentationEntry' && entry.source === 'legacy' && next?.type === 'TextEntry'
        ? next.text
        : '';
    return printEntry(entry, indent, replaced, ctx, remainder);
  });
}

function printBlockLike(
  head: string,
  body: BlockBody | undefined,
  content: BlockContent,
  ctx: PrintContext,
  replaced: ReadonlySet<string> = new Set()
): string {
  // Fall back to the legacy projection when no canonical body was retained.
  const entries = (body ?? blockContentToBody(content)).entries;
  const lines = printEntries(entries, INDENT, replaced, ctx);
  return lines.length === 0 ? `${head} {\n}` : `${head} {\n${lines.join('\n')}\n}`;
}

function printBlock(block: Block, ctx: PrintContext): string {
  return printBlockLike(`@${block.name}`, block.canonicalBody, block.content, ctx);
}

function printExtend(block: ExtendBlock, ctx: PrintContext): string {
  const replaced = new Set((block.replacements ?? []).map((replacement) => replacement.property));
  return printBlockLike(
    `@extend ${block.targetPath}`,
    block.canonicalBody,
    block.content,
    ctx,
    replaced
  );
}

function printOverride(block: OverrideBlock, ctx: PrintContext): string {
  const head = `@override ${block.targetPath}`;
  const { replacement } = block;
  switch (replacement.type) {
    case 'BlockReplacement': {
      const lines = printEntries(replacement.body.entries, INDENT, new Set(), ctx);
      return `${head} {\n${lines.join('\n')}\n}`;
    }
    case 'ValueReplacement':
      return `${head} {\n${INDENT}${printValueNode(replacement.value, INDENT, ctx)}\n}`;
    default:
      return assertNever(replacement);
  }
}

/**
 * Print a parsed program as canonical `.prs` source (2-space indent).
 *
 * Comments are not part of the AST and are not printed. Top-level declarations
 * are emitted grouped by kind (meta, inherit, uses, blocks, extends, overrides)
 * because the legacy AST does not retain their interleaved order.
 */
export function printProgram(ast: Program): string {
  // A quoted "${VAR}" must stay quoted unless the source already used the env-var-value feature,
  // otherwise the round trip would add that feature to the program.
  const ctx: PrintContext = {
    bareEnv: (ast.syntaxFeatures ?? []).some(
      (usage) => usage.feature === SYNTAX_FEATURES.ENV_VAR_VALUE
    ),
  };
  const sections: string[] = [];
  if (ast.meta) sections.push(printMeta(ast.meta, ctx));
  if (ast.inherit) sections.push(printImport('inherit', ast.inherit, ctx));
  sections.push(...ast.uses.map((use) => printUse(use, ctx)));
  sections.push(...ast.blocks.map((block) => printBlock(block, ctx)));
  sections.push(...ast.extends.map((block) => printExtend(block, ctx)));
  sections.push(...(ast.overrides ?? []).map((block) => printOverride(block, ctx)));
  return sections.join('\n\n') + '\n';
}
