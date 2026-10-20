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
    case 'list':
    case 'string':
    case 'number':
    case 'boolean':
      return expr.kind;
    default:
      /* v8 ignore next -- exhaustive switch */
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
      if (comments.length === 0) {
        return printArray(
          node.elements.map((element) => printValueNode(element.value, inner, ctx)),
          indent
        );
      }
      // The comma has to be part of the element so a trailing comment lands after it.
      const last = node.elements.length - 1;
      const items = node.elements.map<Placed>((element, index) => ({
        loc: element.loc,
        holds: isContainer(element.value),
        print: (own) => [
          inner +
            printValueNode(element.value, inner, ctx, own, depth + 1) +
            (index < last ? ',' : ''),
        ],
      }));
      return closeList('[', withComments(items, comments, inner, depth + 1), ']', indent);
    }
    case 'ObjectValueNode': {
      if (comments.length === 0) {
        return printList(
          node.fields.map(
            (field) => `${printKey(field.name)}: ${printValueNode(field.value, inner, ctx)}`
          ),
          '{',
          '}',
          indent
        );
      }
      const items = node.fields.map<Placed>((field) => ({
        loc: field.loc,
        holds: isContainer(field.value),
        print: (own) => [
          `${inner}${printKey(field.name)}: ${printValueNode(field.value, inner, ctx, own, depth + 1)}`,
        ],
      }));
      return closeList('{', withComments(items, comments, inner, depth + 1), '}', indent);
    }
    default:
      /* v8 ignore next -- exhaustive switch */
      return assertNever(node);
  }
}

function closeList(open: string, groups: string[][], close: string, indent: string): string {
  return `${open}\n${groups.flat().join('\n')}\n${indent}${close}`;
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
  const args = params.map((param) => `${param.name}: ${printValue(param.value, '', ctx)}`);
  return `(${args.join(', ')})`;
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
    const leading = rest.filter((c) => offsetOf(c.loc) < start);
    rest = rest.filter((c) => offsetOf(c.loc) >= start);
    const isInside = (c: Comment): boolean =>
      item.holds && c.depth > depth && offsetOf(c.loc) < end;
    const inside = rest.filter(isInside);
    rest = rest.filter((c) => !isInside(c));
    const lines = [...item.print(inside)];
    // Only the next comment in order can trail the item; taking a later one would reorder comments.
    const trailing = rest[0];
    if (trailing?.trailing && trailing.depth <= depth && offsetOf(trailing.loc) < end) {
      lines[lines.length - 1] += ` ${trailing.text}`;
      rest = rest.filter((c) => c !== trailing);
    }
    groups.push([...leading.map((c) => indent + c.text), ...lines]);
  });
  if (rest.length > 0) groups.push(rest.map((c) => indent + c.text));
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
  // Known limit: MetaBlock fields carry no source positions, so every comment inside @meta
  // moves to just before its closing brace (text and order are kept). Fixing that needs
  // positions on MetaBlock in core. Tracked in #555.
  return `@meta ${printList([...lines, ...comments.map((c) => c.text)], '{', '}', '')}`;
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
      const marker = fieldMarker(entry, replaced);
      const fallback = entry.defaultValue
        ? ` = ${printValueNode(entry.defaultValue, indent, ctx)}`
        : '';
      return [
        `${indent}${printKey(entry.name)}${marker}: ${printValueNode(entry.value, indent, ctx, comments)}${fallback}`,
      ];
    }
    case 'ListEntry': {
      // restrictionItem only accepts a StringLiteral, so a string item must never print bare.
      const { value } = entry;
      const item =
        value.type === 'ScalarValueNode' && typeof value.value === 'string'
          ? quote(value.value)
          : printValueNode(value, indent, ctx, comments);
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
      /* v8 ignore next -- exhaustive switch */
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
  const lines = withComments(items, comments, INDENT, BLOCK_DEPTH).flat();
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
            print: (inside) => [INDENT + printValueNode(replacement.value, INDENT, ctx, inside)],
          },
        ],
        comments
      );
    default:
      /* v8 ignore next -- exhaustive switch */
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
    default:
      /* v8 ignore next -- exhaustive switch */
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
 * arrays. Printing the reparsed output gives the same text.
 *
 * Known limits: comments inside `@meta` move before its closing brace (tracked
 * in #555), blank lines between comments are not kept, and comments in the
 * parameter list of `@use` or `@inherit` are printed before the next declaration.
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
  const sections = withComments(items, comments, '', 0).map((group) => group.join('\n'));
  return sections.join('\n\n') + '\n';
}
