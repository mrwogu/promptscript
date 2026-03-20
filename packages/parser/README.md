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
    Token stream     Concrete Syntax Tree    Program AST
```

The parser uses [Chevrotain](https://chevrotain.io/) for lexing and parsing, then
transforms the Concrete Syntax Tree (CST) into the PromptScript AST via a visitor.

## API

### Parse Functions

| Function                 | Description                                                       |
| :----------------------- | :---------------------------------------------------------------- |
| `parse(input)`           | Parse source text, returns `ParseResult` with AST and diagnostics |
| `parseOrThrow(input)`    | Parse source text, throws `ParseError` on failure                 |
| `parseFile(path)`        | Parse a `.prs` file from disk                                     |
| `parseFileOrThrow(path)` | Parse a `.prs` file, throws on failure                            |

### Lexer

| Export            | Description                             |
| :---------------- | :-------------------------------------- |
| `PSLexer`         | Chevrotain lexer instance               |
| `tokenize(input)` | Tokenize source text into a token array |
| `tokens`          | All token type definitions              |

### Parser & Visitor

| Export               | Description                 |
| :------------------- | :-------------------------- |
| `PromptScriptParser` | Chevrotain parser class     |
| `parser`             | Singleton parser instance   |
| `visitor`            | CST-to-AST visitor instance |

### Types

| Type           | Description                      |
| :------------- | :------------------------------- |
| `ParseOptions` | Options for parse functions      |
| `ParseResult`  | Result containing AST and errors |

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

## License

MIT
