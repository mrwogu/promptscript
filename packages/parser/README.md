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
| `tokens`          | All token type definitions              |

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

| Type                   | Description                          |
| :--------------------- | :----------------------------------- |
| `ParseOptions`         | Options for parse functions          |
| `ParseResult`          | Mutable compatibility AST and errors |
| `CanonicalParseResult` | Immutable canonical AST and errors   |

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

## License

MIT
