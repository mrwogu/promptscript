import { SYNTAX_FEATURES } from '@promptscript/core';
import type { Comment } from './comments.js';
import type {
  BlockBody,
  BlockEntry,
  CanonicalExtendBlock,
  CanonicalOverrideBlock,
  CanonicalProgram,
  DeepReadonly,
  InheritDeclaration,
  InlineUseDeclaration,
  MetaBlock,
  ParamArgument,
  ParamDefinition,
  PrimitiveValue,
  ProgramOperation,
  SourceLocation,
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

function printParams(params: DeepReadonly<ParamArgument[]> | undefined, ctx: PrintContext): string {
  if (!params) return '';
  return `(${params.map((param) => `${param.name}: ${printValue(param.value, '', ctx)}`).join(', ')})`;
}

function printImport(
  keyword: string,
  decl: DeepReadonly<InheritDeclaration | UseDeclaration | InlineUseDeclaration>,
  ctx: PrintContext
): string {
  return `@${keyword} ${decl.path.raw}${printParams(decl.params, ctx)}`;
}

function printUse(
  decl: DeepReadonly<UseDeclaration | InlineUseDeclaration>,
  ctx: PrintContext
): string {
  const parts = [printImport('use', decl, ctx)];
  if (decl.alias) parts.push(`as ${decl.alias}`);
  if (decl.outputDir) parts.push(`into ${quote(decl.outputDir)}`);
  return parts.join(' ');
}

function printParamDefinition(
  def: DeepReadonly<ParamDefinition>,
  indent: string,
  ctx: PrintContext
): string {
  const type =
    def.paramType.kind === 'enum'
      ? `enum(${def.paramType.options.map(quote).join(', ')})`
      : def.paramType.kind;
  const hasDefault = def.defaultValue !== undefined;
  const optional = def.optional && !hasDefault ? '?' : '';
  const fallback = hasDefault ? ` = ${printValue(def.defaultValue!, indent, ctx)}` : '';
  return `${def.name}${optional}: ${type}${fallback}`;
}

/** A printed declaration or entry with the source position used to place comments around it. */
interface Placed {
  readonly loc: SourceLocation;
  readonly lines: string[];
}

function offsetOf(loc: SourceLocation): number {
  return loc.offset ?? 0;
}

/**
 * Comments are not in the AST, so each one is re-attached by source position:
 * it is printed before the first item that starts after it, which keeps a
 * comment above the thing it described. A comment on the line where an item
 * starts stays on that line. Whatever is left sat after the last item and
 * closes the container. Returns one group per item so callers can choose the
 * separator, plus a final group for the leftovers when there are any.
 */
function withComments(
  items: readonly Placed[],
  comments: readonly Comment[],
  indent: string
): string[][] {
  const groups: string[][] = [];
  let next = 0;
  items.forEach((item, index) => {
    const group: string[] = [];
    while (next < comments.length && offsetOf(comments[next]!.loc) < offsetOf(item.loc)) {
      group.push(indent + comments[next++]!.text);
    }
    const lines = [...item.lines];
    const trailing = comments[next];
    const nextStart = items[index + 1] ? offsetOf(items[index + 1]!.loc) : Infinity;
    if (trailing && trailing.loc.line === item.loc.line && offsetOf(trailing.loc) < nextStart) {
      lines[lines.length - 1] += ` ${trailing.text}`;
      next++;
    }
    groups.push([...group, ...lines]);
  });
  if (next < comments.length) groups.push(comments.slice(next).map((c) => indent + c.text));
  return groups;
}

function printMeta(
  meta: DeepReadonly<MetaBlock>,
  comments: readonly Comment[],
  ctx: PrintContext
): string {
  const lines = Object.entries(meta.fields).map(
    ([key, value]) => `${printKey(key)}: ${printValue(value, INDENT, ctx)}`
  );
  if (meta.params) {
    const defs = meta.params.map((def) => printParamDefinition(def, INDENT + INDENT, ctx));
    lines.push(`params: ${printList(defs, '{', '}', INDENT)}`);
  }
  // Meta fields carry no positions, so comments inside @meta gather before its closing brace.
  return `@meta ${printList([...lines, ...comments.map((c) => c.text)], '{', '}', '')}`;
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
): Placed[] {
  return entries.flatMap((entry, index) => {
    const previous = entries[index - 1];
    if (previous?.type === 'PresentationEntry' && previous.source === 'legacy') {
      return entry.type === 'TextEntry'
        ? []
        : [{ loc: entry.loc, lines: printEntry(entry, indent, replaced, ctx) }];
    }
    const next = entries[index + 1];
    const remainder =
      entry.type === 'PresentationEntry' && entry.source === 'legacy' && next?.type === 'TextEntry'
        ? next.text
        : '';
    return [{ loc: entry.loc, lines: printEntry(entry, indent, replaced, ctx, remainder) }];
  });
}

function printBracedBody(
  head: string,
  items: readonly Placed[],
  comments: readonly Comment[]
): string[] {
  const lines = withComments(items, comments, INDENT).flat();
  return lines.length === 0 ? [`${head} {`, '}'] : [`${head} {`, ...lines, '}'];
}

function printBlockLike(
  head: string,
  body: DeepReadonly<BlockBody>,
  comments: readonly Comment[],
  ctx: PrintContext,
  replaced: ReadonlySet<string> = new Set()
): string[] {
  return printBracedBody(head, printEntries(body.entries, INDENT, replaced, ctx), comments);
}

function printExtend(
  block: DeepReadonly<CanonicalExtendBlock>,
  comments: readonly Comment[],
  ctx: PrintContext
): string[] {
  const replaced = new Set((block.replacements ?? []).map((replacement) => replacement.property));
  return printBlockLike(`@extend ${block.targetPath}`, block.body, comments, ctx, replaced);
}

function printOverride(
  block: DeepReadonly<CanonicalOverrideBlock>,
  comments: readonly Comment[],
  ctx: PrintContext
): string[] {
  const head = `@override ${block.targetPath}`;
  const { replacement } = block;
  switch (replacement.type) {
    case 'BlockReplacement':
      return printBracedBody(
        head,
        printEntries(replacement.body.entries, INDENT, new Set(), ctx),
        comments
      );
    case 'ValueReplacement':
      return printBracedBody(
        head,
        [
          {
            loc: replacement.value.loc,
            lines: [INDENT + printValueNode(replacement.value, INDENT, ctx)],
          },
        ],
        comments
      );
    default:
      return assertNever(replacement);
  }
}

function printOperation(
  operation: DeepReadonly<ProgramOperation>,
  comments: readonly Comment[],
  ctx: PrintContext
): string[] {
  // Declarations without a body have nowhere inside to put comments, so they follow it.
  const after = comments.map((c) => c.text);
  switch (operation.type) {
    case 'InheritOperation':
      return [printImport('inherit', operation.declaration, ctx), ...after];
    case 'UseOperation':
      return [printUse(operation.declaration, ctx), ...after];
    case 'BlockOperation':
      return printBlockLike(`@${operation.block.name}`, operation.block.body, comments, ctx);
    case 'ExtendOperation':
      return printExtend(operation.extension, comments, ctx);
    case 'OverrideOperation':
      return printOverride(operation.override, comments, ctx);
    default:
      return assertNever(operation);
  }
}

/**
 * Print a parsed program as canonical `.prs` source (2-space indent), in the
 * order the author wrote it. Pass the comments from the parse result to keep
 * them; without them none are printed.
 */
export function printProgram(
  program: DeepReadonly<CanonicalProgram>,
  comments: readonly Comment[] = []
): string {
  // A quoted "${VAR}" must stay quoted unless the source already used the env-var-value feature,
  // otherwise the round trip would add that feature to the program.
  const ctx: PrintContext = {
    bareEnv: (program.syntaxFeatures ?? []).some(
      (usage) => usage.feature === SYNTAX_FEATURES.ENV_VAR_VALUE
    ),
  };
  // @meta is not an operation, so merge it back in by position.
  const declarations = [
    ...(program.meta ? [{ loc: program.meta.loc, operation: undefined }] : []),
    ...program.operations.map((operation) => ({ loc: operation.loc, operation })),
  ].sort((a, b) => offsetOf(a.loc) - offsetOf(b.loc));
  const insideOf = (index: number): Comment[] => {
    const end = declarations[index + 1] ? offsetOf(declarations[index + 1]!.loc) : Infinity;
    return comments.filter(
      (c) =>
        c.depth > 0 &&
        offsetOf(c.loc) >= offsetOf(declarations[index]!.loc) &&
        offsetOf(c.loc) < end
    );
  };
  const items: Placed[] = declarations.map(({ loc, operation }, index) => ({
    loc,
    lines:
      operation === undefined
        ? printMeta(program.meta!, insideOf(index), ctx).split('\n')
        : printOperation(operation, insideOf(index), ctx),
  }));
  const topLevel = comments.filter((c) => c.depth === 0);
  const sections = withComments(items, topLevel, '').map((group) => group.join('\n'));
  return sections.join('\n\n') + '\n';
}
