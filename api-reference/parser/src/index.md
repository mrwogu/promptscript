# Parser API

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# parser/src

Chevrotain-based parser for the PromptScript language.

Handles the lexical analysis and parsing of `.prs` files into the Abstract Syntax Tree (AST).

## Classes

- [PromptScriptParser](https://getpromptscript.dev/api-reference/parser/src/classes/PromptScriptParser/index.md)

## Interfaces

- [CanonicalParseResult](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)
- [Comment](https://getpromptscript.dev/api-reference/parser/src/interfaces/Comment/index.md)
- [ParseOptions](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md)
- [ParseResult](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseResult/index.md)

## Type Aliases

- [EnvProvider](https://getpromptscript.dev/api-reference/parser/src/type-aliases/EnvProvider/index.md)

## Variables

- [~~parser~~](https://getpromptscript.dev/api-reference/parser/src/variables/parser/index.md)
- [PSLexer](https://getpromptscript.dev/api-reference/parser/src/variables/PSLexer/index.md)
- [~~visitor~~](https://getpromptscript.dev/api-reference/parser/src/variables/visitor/index.md)

## Functions

- [createParser](https://getpromptscript.dev/api-reference/parser/src/functions/createParser/index.md)
- [createVisitor](https://getpromptscript.dev/api-reference/parser/src/functions/createVisitor/index.md)
- [parse](https://getpromptscript.dev/api-reference/parser/src/functions/parse/index.md)
- [parseCanonical](https://getpromptscript.dev/api-reference/parser/src/functions/parseCanonical/index.md)
- [parseCanonicalFile](https://getpromptscript.dev/api-reference/parser/src/functions/parseCanonicalFile/index.md)
- [parseCanonicalFileOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseCanonicalFileOrThrow/index.md)
- [parseCanonicalOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseCanonicalOrThrow/index.md)
- [parseFile](https://getpromptscript.dev/api-reference/parser/src/functions/parseFile/index.md)
- [parseFileCanonical](https://getpromptscript.dev/api-reference/parser/src/functions/parseFileCanonical/index.md)
- [parseFileCanonicalOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseFileCanonicalOrThrow/index.md)
- [parseFileOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseFileOrThrow/index.md)
- [parseOrThrow](https://getpromptscript.dev/api-reference/parser/src/functions/parseOrThrow/index.md)
- [printProgram](https://getpromptscript.dev/api-reference/parser/src/functions/printProgram/index.md)
- [tokenize](https://getpromptscript.dev/api-reference/parser/src/functions/tokenize/index.md)