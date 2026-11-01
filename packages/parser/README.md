# @promptscript/parser

> **Internal package** - Part of the [PromptScript](https://github.com/mrwogu/promptscript) monorepo.

Chevrotain-based parser for PromptScript language.

## Status

This is an internal package bundled into `@promptscript/cli`. It is not published to npm separately.

## Architecture

```
  .prs source text
        |
        v
  +------------+     +----------------+     +-------------+
  |   Lexer    |---->|    Parser      |---->|   Visitor   |
  |  (PSLexer) |     | (Chevrotain    |     | (CST -> AST |
  |  tokenize  |     |  grammar)      |     |  transform) |
  +------------+     +----------------+     +-------------+
        |                   |                      |
    Token stream     Concrete Syntax Tree   CanonicalProgram
```

The parser uses [Chevrotain](https://chevrotain.io/) for lexing and parsing, then
transforms the Concrete Syntax Tree (CST) into an immutable, source-ordered
canonical AST via a visitor. The original mutable AST remains available through
the legacy parse functions.

## API

### Parse Functions

| Function                          | Description                                                             |
| :-------------------------------- | :---------------------------------------------------------------------- |
| `parse(input)`                    | Parse source text to a mutable compatibility AST and diagnostics        |
| `parseOrThrow(input)`             | Parse source text to a mutable compatibility AST, throwing on failure   |
| `parseFile(path)`                 | Parse a `.prs` file to a mutable compatibility AST                      |
| `parseFileOrThrow(path)`          | Parse a `.prs` file to a mutable compatibility AST, throwing on failure |
| `parseCanonical(input)`           | Parse source text to an immutable, source-ordered canonical AST         |
| `parseCanonicalOrThrow(input)`    | Parse to a canonical AST, throwing `ParseError` on failure              |
| `parseCanonicalFile(path)`        | Parse a `.prs` file from disk to a canonical AST                        |
| `parseCanonicalFileOrThrow(path)` | Parse a `.prs` file from disk to a canonical AST, throwing on failure   |

### Lexer

| Export            | Description                             |
| :---------------- | :-------------------------------------- |
| `PSLexer`         | Chevrotain lexer instance               |
| `tokenize(input)` | Tokenize source text into a token array |

### Parser & Visitor

| Export               | Description                           |
| :------------------- | :------------------------------------ |
| `PromptScriptParser` | Chevrotain parser class               |
| `createParser`       | Create an isolated parser instance    |
| `parser`             | Deprecated shared parser instance     |
| `createVisitor`      | Create an isolated CST-to-AST visitor |
| `visitor`            | Deprecated shared visitor instance    |

Parse helpers give every request exclusive ownership of a parser and a fresh
visitor, so concurrent and reentrant parses cannot observe each other's tokens,
diagnostics, or environment providers. Parser instances are pooled and reset on
release, which keeps Chevrotain's grammar analysis cost out of the parse path.

The `parser` and `visitor` exports remain for backward compatibility but are
deprecated: both accumulate request state, so sharing them across concurrent or
reentrant calls cross-contaminates results. Use `createParser` and
`createVisitor` instead.

### Types

| Type                   | Description                                                  |
| :--------------------- | :----------------------------------------------------------- |
| `ParseOptions`         | Options for parse functions                                  |
| `ParseResult`          | Mutable compatibility AST and errors                         |
| `CanonicalParseResult` | Immutable canonical AST and errors                           |
| `Comment`              | A `#` comment or blank-line run: kind, text, location, depth |

Both parse results also carry `comments`, the `#` comments of the source in
order. Each blank-line run outside a string or text block is listed too, as an
entry with `kind: 'blank'` and empty `text`; real comments have
`kind: 'comment'`. Neither is part of the AST, so the resolver, validator and
formatters never see them.

## Usage (internal)

```typescript
import { parse, parseOrThrow, parseFile } from '@promptscript/parser';
import type { ParseResult } from '@promptscript/parser';

// Parse with error recovery
const result: ParseResult = parse(sourceText);
if (result.errors.length > 0) {
  // handle diagnostics
}

// Parse or throw
const ast = parseOrThrow(sourceText);

// Parse from file
const fileResult = await parseFile('./project.prs');
```

Use `parseCanonical` or `parseCanonicalOrThrow` for new integrations that need
exact top-level and block-body source order.

## Printing

`printProgram(program, comments?)` turns a `CanonicalProgram` back into `.prs`
source (2-space indent). Pass the `ast` and `comments` from `parseCanonical`.

```
  source --parseCanonical--> { ast, comments } --printProgram--> source
```

```typescript
import { parseCanonical, printProgram } from '@promptscript/parser';

const source = `# who we are
@identity {
  name: "demo" # short name
  # why
  tags: ["a", "b"]
}
`;

const { ast, comments, errors } = parseCanonical(source);
if (ast && errors.length === 0) {
  console.log(printProgram(ast, comments));
}
```

This prints the source back unchanged:

```
# who we are
@identity {
  name: "demo" # short name
  # why
  tags: ["a", "b"]
}
```

What is kept:

- Declarations and block entries in the order the author wrote them
  (`@meta`, `@inherit`, `@use`, blocks, `@extend` and `@override` are not regrouped).
- Comments: above an entry or declaration, trailing on a line, after the last
  entry of a block, and inside nested objects and arrays. A `#` inside a string
  or text block is content, not a comment.
- Blank lines: one or more in the source stay as one. None are added, and none
  are kept right after an opening or before a closing brace or bracket, or at
  the start or end of the file. Blank lines inside a text block are content.
- Numbers (no exponent notation) and `${VAR}` references.

Arrays stay on one line while the line fits in 100 characters; longer ones, and
arrays of objects, print one element per line.

Printing is stable: printing the reparsed output gives the same text. Without
`comments`, no comments and no blank lines are printed, so declarations follow
each other on consecutive lines. A non-finite number in a hand-built AST
throws.

Known limits:

- Comments inside `@meta` move to just before its closing brace, because
  `@meta` fields carry no source positions. Text and order are kept. Tracked in
  [#555](https://github.com/mrwogu/promptscript/issues/555).
- Comments inside the parameter list of `@use` or `@inherit` are printed on
  their own lines before the next declaration.
- Blank lines inside `@meta` and inside the parameter list of `@use` or
  `@inherit` are dropped.

## License

MIT
