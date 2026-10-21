import { SYNTAX_FEATURES } from '@promptscript/core';
import type { Comment } from './comments.js';
import type {
  BlockBody,
  BlockEntry,
  CanonicalExtendBlock,
  CanonicalOverrideBlock,
  CanonicalProgram,
  DeepReadonly,
  FieldEntry,
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

const ESCAPES = new Map([
  ['\\', String.raw`\\`],
  ['"', String.raw`\"`],
  ['\n', String.raw`\n`],
  ['\t', String.raw`\t`],
  ['\r', String.raw`\r`],
]);

function quote(value: string): string {
  return `"${value.replaceAll(/["\\\n\t\r]/g, (ch) => ESCAPES.get(ch) ?? ch)}"`;
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
  // String(n) has one leading digit, so point is <= 0 or >= digits.length: no decimal point is left.
  return `${sign}${digits}${'0'.repeat(point - digits.length)}`;
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
      return `enum(${(constraints?.options ?? []).map((option) => quote(typeof option === 'string' ? option : JSON.stringify(option))).join(', ')})`;
    /* v8 ignore next -- the grammar has no list type keyword */
    case 'list':
    case 'string':
    case 'number':
    case 'boolean':
      return expr.kind;
    /* v8 ignore next 2 -- exhaustive switch */
    default:
      return assertNever(expr.kind);
  }
}

/* v8 ignore next 3 -- exhaustiveness guard */
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

/** Width left for an array element on its own line; every element but the last is followed by a comma. */
function elementRoom(inner: string, index: number, last: number): number {
  return PRINT_WIDTH - inner.length - (index < last ? 1 : 0);
}

/**
 * True for a printed value that can break across lines: a non-empty array, an object (always
 * `{` and a line break, unlike a `{{template}}`) or a text block.
 */
function canWrap(flat: string): boolean {
  return flat.length > 2 && /^(\[|\{\n|""")/.test(flat);
}

/** Width a printed value needs on the line where it starts: all of it, or only its opening token if it can wrap. */
function headWidth(flat: string): number {
  if (!canWrap(flat)) return flat.length;
  return flat.startsWith('"""') ? 3 : 1;
}

/** Print a legacy `Value` (meta fields, params, @use arguments). */
function printValue(
  value: Value | DeepReadonly<Value>,
  indent: string,
  ctx: PrintContext,
  room: number
): string {
  if (value === null || typeof value !== 'object') return printScalar(value, ctx);
  if (Array.isArray(value)) {
    const last = value.length - 1;
    const inner = indent + INDENT;
    return printArray(
      value.map((item, index) => printValue(item, inner, ctx, elementRoom(inner, index, last))),
      indent,
      room
    );
  }
  if (isNode(value, 'TextContent')) return printText(value.value, indent);
  if (isNode(value, 'TemplateExpression')) return `{{${value.name}}}`;
  if (isNode(value, 'TypeExpression')) return printTypeExpression(value);
  const lines = Object.entries(value).map(([key, entry]) => {
    const head = `${printKey(key)}: `;
    const inner = indent + INDENT;
    return head + printValue(entry as Value, inner, ctx, PRINT_WIDTH - inner.length - head.length);
  });
  return printList(lines, '{', '}', indent);
}

function isContainer(node: ValueNode): boolean {
  return node.type === 'ArrayValueNode' || node.type === 'ObjectValueNode';
}

/**
 * Print a canonical `ValueNode`. `comments` are those inside the value and
 * `depth` is the nesting depth of the container the value sits in, so nested
 * arrays and objects can place them like a block does.
 */
function printValueNode(
  node: ValueNode,
  indent: string,
  ctx: PrintContext,
  room: number,
  comments: readonly Comment[] = [],
  depth = BLOCK_DEPTH
): string {
  const inner = indent + INDENT;
  switch (node.type) {
    case 'ScalarValueNode':
      return printScalar(node.value, ctx);
    case 'TextValueNode':
      return printText(node.value, indent);
    case 'TemplateValueNode':
      return `{{${node.name}}}`;
    case 'TypeExpressionValueNode':
      return printTypeExpression(node.expression);
    case 'ArrayValueNode': {
      if (comments.length > 0) {
        // The comma has to be part of the element so a trailing comment lands after it.
        const last = node.elements.length - 1;
        const items = node.elements.map<Placed>((element, index) => ({
          loc: element.loc,
          holds: isContainer(element.value),
          print: (own) => [
            inner +
              printValueNode(
                element.value,
                inner,
                ctx,
                elementRoom(inner, index, last),
                own,
                depth + 1
              ) +
              (index < last ? ',' : ''),
          ],
        }));
        const laidOut = closeList(
          '[',
          withComments(items, comments, inner, depth + 1),
          ']',
          indent
        );
        if (keepsLayout(comments, laidOut)) return laidOut;
      }
      const lastElement = node.elements.length - 1;
      return printArray(
        node.elements.map((element, index) =>
          printValueNode(element.value, inner, ctx, elementRoom(inner, index, lastElement))
        ),
        indent,
        room
      );
    }
    case 'ObjectValueNode': {
      if (comments.length > 0) {
        const items = node.fields.map<Placed>((field) => {
          const head = `${inner}${printKey(field.name)}: `;
          return {
            loc: field.loc,
            holds: isContainer(field.value),
            print: (own) => [
              head +
                printValueNode(field.value, inner, ctx, PRINT_WIDTH - head.length, own, depth + 1),
            ],
          };
        });
        const laidOut = closeList(
          '{',
          withComments(items, comments, inner, depth + 1),
          '}',
          indent
        );
        if (keepsLayout(comments, laidOut)) return laidOut;
      }
      return printList(
        node.fields.map((field) => {
          const head = `${printKey(field.name)}: `;
          return (
            head + printValueNode(field.value, inner, ctx, PRINT_WIDTH - inner.length - head.length)
          );
        }),
        '{',
        '}',
        indent
      );
    }
    /* v8 ignore next 2 -- exhaustive switch */
    default:
      return assertNever(node);
  }
}

function closeList(open: string, groups: string[][], close: string, indent: string): string {
  return `${open}\n${layout(groups).join('\n')}\n${indent}${close}`;
}

/**
 * A container printed with its comments only differs from the plain form when a
 * real comment or a blank line survived; edge blank lines alone must not force it.
 */
function keepsLayout(comments: readonly Comment[], printed: string): boolean {
  return comments.some((c) => c.kind === 'comment') || printed.split('\n').includes(BLANK);
}

/** Printing width the repo's Prettier config uses; arrays that fit stay on one line. */
const PRINT_WIDTH = 100;

/** `room` is the width left on the line for the array after what precedes and follows it. */
function printArray(printed: string[], indent: string, room: number): string {
  // Arrays need commas, so keep the simple case on one line while it fits.
  if (printed.every((item) => !item.includes('\n'))) {
    const line = `[${printed.join(', ')}]`;
    if (line.length <= room) return line;
  }
  return printList(
    printed.map((item, index) => (index < printed.length - 1 ? `${item},` : item)),
    '[',
    ']',
    indent
  );
}

function printParams(
  params: DeepReadonly<ParamArgument[]> | undefined,
  ctx: PrintContext,
  prefix: string,
  tail: string,
  indent: string
): string {
  if (!params) return '';
  // Each argument sits on the line after the path and the arguments before it, and is
  // followed by a comma, or by the closing parenthesis and whatever `tail` adds after it.
  let width = indent.length + prefix.length + 1;
  const args = params.map((param, index) => {
    const head = `${param.name}: `;
    // What must still fit on this line after the argument: the later arguments up to the first
    // line break, then the closing parenthesis and the tail. A later value that can wrap only
    // needs its opening token on this line, and ends the line.
    let after = 0;
    let lineEnds = false;
    for (const later of params.slice(index + 1)) {
      if (lineEnds) break;
      const flat = printValue(later.value, indent, ctx, Infinity);
      after += 2 + `${later.name}: `.length + headWidth(flat);
      lineEnds = canWrap(flat);
    }
    if (!lineEnds) after += 1 + tail.length;
    const text =
      head + printValue(param.value, indent, ctx, PRINT_WIDTH - width - head.length - after);
    // A wrapped argument ends on a fresh line, so the next one continues after its last line.
    const newline = text.lastIndexOf('\n');
    width = newline === -1 ? width + text.length + 2 : text.length - newline - 1 + 2;
    return text;
  });
  return `(${args.join(', ')})`;
}

function printImport(
  keyword: string,
  decl: DeepReadonly<InheritDeclaration | UseDeclaration | InlineUseDeclaration>,
  ctx: PrintContext,
  tail = '',
  indent = ''
): string {
  const head = `@${keyword} ${decl.path.raw}`;
  return head + printParams(decl.params, ctx, head, tail, indent) + tail;
}

function printUse(
  decl: DeepReadonly<UseDeclaration | InlineUseDeclaration>,
  ctx: PrintContext,
  indent = ''
): string {
  const tail = [
    ...(decl.alias ? [` as ${decl.alias}`] : []),
    ...(decl.outputDir ? [` into ${quote(decl.outputDir)}`] : []),
  ].join('');
  return printImport('use', decl, ctx, tail, indent);
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
  const head = `${def.name}${optional}: ${type}`;
  const fallback = hasDefault
    ? ` = ${printValue(def.defaultValue!, indent, ctx, PRINT_WIDTH - indent.length - head.length - 3)}`
    : '';
  return head + fallback;
}

/** A printed declaration or entry with the source position used to place comments around it. */
interface Placed {
  readonly loc: SourceLocation;
  /** Prints the item, given the comments that sit inside it (only when `holds`). */
  readonly print: (inside: readonly Comment[]) => string[];
  /** True when the item can place comments nested inside it; others leave them to their neighbours. */
  readonly holds: boolean;
}

/** Entries of a block sit one level inside it. */
const BLOCK_DEPTH = 1;

function offsetOf(loc: SourceLocation): number {
  return loc.offset ?? 0;
}

/**
 * Comments are not in the AST, so each one is re-attached by source position:
 * it is printed before the first item that starts after it, which keeps a
 * comment above the thing it described. A comment that followed code on its
 * line stays after the item it followed. Comments nested deeper than this
 * container go to the item they sit inside. Whatever is left sat after the
 * last item and closes the container. Returns one group per item so callers can
 * choose the separator, plus a final group for the leftovers when there are any.
 *
 * Attaching by the `trailing` flag, not by comparing line numbers, is what keeps
 * printing stable: a multi-line item prints its comment on a different line than
 * the one the item started on.
 */
function withComments(
  items: readonly Placed[],
  comments: readonly Comment[],
  indent: string,
  depth: number
): string[][] {
  const groups: string[][] = [];
  let rest = comments;
  items.forEach((item, index) => {
    const start = offsetOf(item.loc);
    const end = items[index + 1] ? offsetOf(items[index + 1]!.loc) : Infinity;
    const leading = rest.filter((c) => offsetOf(c.loc) < start && !isStray(c, depth));
    rest = rest.filter((c) => offsetOf(c.loc) >= start);
    const isInside = (c: Comment): boolean =>
      item.holds && c.depth > depth && offsetOf(c.loc) < end;
    const inside = rest.filter(isInside);
    // A blank line nested in an item that cannot place it must not block a comment trailing the item.
    rest = rest.filter((c) => !isInside(c) && !(isStray(c, depth) && offsetOf(c.loc) < end));
    const lines = [...item.print(inside)];
    // Only the next comment in order can trail the item; taking a later one would reorder comments.
    const trailing = rest[0];
    if (trailing?.trailing && trailing.depth <= depth && offsetOf(trailing.loc) < end) {
      lines[lines.length - 1] += ` ${trailing.text}`;
      rest = rest.filter((c) => c !== trailing);
    }
    groups.push([...leading.map((c) => line(c, indent)), ...lines]);
  });
  const left = rest.filter((c) => !isStray(c, depth));
  if (left.length > 0) groups.push(left.map((c) => line(c, indent)));
  return groups;
}

/** Marks a blank line until the very end, so blank lines of text content are never mistaken for it. */
const BLANK = '\u0000}prs-blank';

function line(c: Comment, indent: string): string {
  return c.kind === 'blank' ? BLANK : indent + c.text;
}

/** A blank line nested deeper than the container that received it belongs to something it cannot place. */
function isStray(c: Comment, depth: number): boolean {
  return c.kind === 'blank' && c.depth > depth;
}

/**
 * Flatten placed groups into lines. At most one blank line is kept in a row,
 * and none at the start or end, because the container's edges are not places a
 * source would put one.
 */
function layout(groups: readonly string[][]): string[] {
  const lines = groups.flat().filter((l, i, all) => l !== BLANK || all[i - 1] !== BLANK);
  while (lines[0] === BLANK) lines.shift();
  while (lines.at(-1) === BLANK) lines.pop();
  return lines;
}

function printMeta(
  meta: DeepReadonly<MetaBlock>,
  comments: readonly Comment[],
  ctx: PrintContext
): string {
  const lines = Object.entries(meta.fields).map(([key, value]) => {
    const head = `${printKey(key)}: `;
    return head + printValue(value, INDENT, ctx, PRINT_WIDTH - INDENT.length - head.length);
  });
  if (meta.params) {
    const defs = meta.params.map((def) => printParamDefinition(def, INDENT + INDENT, ctx));
    lines.push(`params: ${printList(defs, '{', '}', INDENT)}`);
  }
  // Known limit: MetaBlock fields carry no source positions, so every comment inside @meta
  // moves to just before its closing brace (text and order are kept). Fixing that needs
  // positions on MetaBlock in core. Tracked in #555.
  const texts = comments.filter((c) => c.kind === 'comment').map((c) => c.text);
  return `@meta ${printList([...lines, ...texts], '{', '}', '')}`;
}

function fieldMarker(entry: FieldEntry, replaced: ReadonlySet<string>): string {
  if (entry.optional) return '?';
  if (replaced.has(entry.name)) return '!';
  return '';
}

function printEntry(
  entry: BlockEntry,
  indent: string,
  replaced: ReadonlySet<string>,
  ctx: PrintContext,
  legacyRemainder = '',
  comments: readonly Comment[] = []
): string[] {
  switch (entry.type) {
    case 'TextEntry':
      return [indent + printText(entry.text, indent)];
    case 'FieldEntry': {
      const head = `${indent}${printKey(entry.name)}${fieldMarker(entry, replaced)}: `;
      // A default that fits on one line follows the value, so the value must leave room for it.
      const flatDefault = entry.defaultValue
        ? printValueNode(entry.defaultValue, indent, ctx, Infinity)
        : '';
      // A default that can wrap only needs its opening token on the value's line.
      const reserve = flatDefault === '' ? 0 : headWidth(flatDefault) + 3;
      const value = printValueNode(
        entry.value,
        indent,
        ctx,
        PRINT_WIDTH - head.length - reserve,
        comments
      );
      // The default value follows the last line of the first value.
      const used = value.includes('\n')
        ? value.length - value.lastIndexOf('\n') - 1
        : head.length + value.length;
      const fallback = entry.defaultValue
        ? ` = ${printValueNode(entry.defaultValue, indent, ctx, PRINT_WIDTH - used - 3)}`
        : '';
      return [`${head}${value}${fallback}`];
    }
    case 'ListEntry': {
      const { value } = entry;
      /* v8 ignore next 3 -- restrictionItem only accepts a string literal */
      if (value.type !== 'ScalarValueNode' || typeof value.value !== 'string') {
        throw new Error('List items are always string literals');
      }
      return [`${indent}- ${quote(value.value)}`];
    }
    case 'InlineUseEntry':
      return [indent + printUse(entry.declaration as InlineUseDeclaration, ctx, indent)];
    case 'PresentationEntry': {
      if (entry.source === 'legacy') {
        // A legacy heading is the first line of a text block, so it is printed as text.
        return [indent + printText(`## ${entry.title}\n${legacyRemainder}`, indent)];
      }
      const section = entry.sectionId ? `${entry.sectionId} ` : '';
      return [`${indent}@header ${section}${quote(entry.title)}`];
    }
    /* v8 ignore next 2 -- exhaustive switch */
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
    // The text after a legacy heading was already folded into the heading's own text block.
    if (previous?.type === 'PresentationEntry' && previous.source === 'legacy') {
      if (entry.type === 'TextEntry') return [];
    }
    const next = entries[index + 1];
    const remainder =
      entry.type === 'PresentationEntry' && entry.source === 'legacy' && next?.type === 'TextEntry'
        ? next.text
        : '';
    const holds =
      (entry.type === 'FieldEntry' || entry.type === 'ListEntry') && isContainer(entry.value);
    return [
      {
        loc: entry.loc,
        holds,
        print: (inside) => printEntry(entry, indent, replaced, ctx, remainder, inside),
      },
    ];
  });
}

function printBracedBody(
  head: string,
  items: readonly Placed[],
  comments: readonly Comment[]
): string[] {
  const lines = layout(withComments(items, comments, INDENT, BLOCK_DEPTH));
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
            holds: isContainer(replacement.value),
            print: (inside) => [
              INDENT +
                printValueNode(replacement.value, INDENT, ctx, PRINT_WIDTH - INDENT.length, inside),
            ],
          },
        ],
        comments
      );
    /* v8 ignore next 2 -- exhaustive switch */
    default:
      return assertNever(replacement);
  }
}

function printOperation(
  operation: DeepReadonly<ProgramOperation>,
  comments: readonly Comment[],
  ctx: PrintContext
): string[] {
  switch (operation.type) {
    case 'InheritOperation':
      return [printImport('inherit', operation.declaration, ctx)];
    case 'UseOperation':
      return [printUse(operation.declaration, ctx)];
    case 'BlockOperation':
      return printBlockLike(`@${operation.block.name}`, operation.block.body, comments, ctx);
    case 'ExtendOperation':
      return printExtend(operation.extension, comments, ctx);
    case 'OverrideOperation':
      return printOverride(operation.override, comments, ctx);
    /* v8 ignore next 2 -- exhaustive switch */
    default:
      return assertNever(operation);
  }
}

/**
 * Print a parsed program as canonical `.prs` source (2-space indent), in the
 * order the author wrote it.
 *
 * Comments live beside the AST, so pass the `comments` from the same
 * `parseCanonical` result; without them none are printed. Each comment is
 * printed above the next declaration or entry, trailing on its line, or before
 * the closing brace of its container, including inside nested objects and
 * arrays. A blank line is kept where the source had one or more (at most one, never
 * at the edge of a block, object, array or file), and an array that does not fit in
 * 100 characters is printed one element per line. Printing the reparsed output gives
 * the same text.
 *
 * Known limits: comments inside `@meta` move before its closing brace (tracked
 * in #555), and comments in the parameter list of `@use` or `@inherit` are printed
 * before the next declaration. Blank lines inside `@meta` and those parameter lists are dropped.
 *
 * @param program - Canonical program from `parseCanonical`
 * @param comments - Comments from the same parse result
 * @returns `.prs` source ending with a newline
 * @throws {Error} If the AST holds a non-finite number, which `.prs` cannot express
 *
 * @example
 * ```typescript
 * const { ast, comments } = parseCanonical('# note\n@identity { a: 1 }');
 * console.log(printProgram(ast!, comments));
 * ```
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
  // Imports have no body to hold comments, so any inside their parameter list are placed like
  // top-level ones; every other declaration takes the comments nested inside it.
  const items = declarations.map<Placed>(({ loc, operation }) => {
    if (operation === undefined) {
      return {
        loc,
        holds: true,
        print: (inside) => printMeta(program.meta!, inside, ctx).split('\n'),
      };
    }
    const holds = operation.type !== 'InheritOperation' && operation.type !== 'UseOperation';
    return { loc, holds, print: (inside) => printOperation(operation, inside, ctx) };
  });
  // Declarations are only separated by a blank line when the source had one.
  // Only whole lines equal to the marker are blank lines; the same bytes in a string stay content.
  const lines = layout(withComments(items, comments, '', 0))
    .join('\n')
    .split('\n');
  return lines.map((l) => (l === BLANK ? '' : l)).join('\n') + '\n';
}
