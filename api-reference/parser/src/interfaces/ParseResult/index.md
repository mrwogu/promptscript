# ParseResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ParseResult

Defined in: [parser/src/parse.ts:42](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L42)

Result of parsing PromptScript source code.

## Properties

### ast

> **ast**: [`Program`](https://getpromptscript.dev/api-reference/core/src/interfaces/Program/index.md) \| `null`

Defined in: [parser/src/parse.ts:44](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L44)

The parsed AST, or null if parsing failed with tolerant=false.

***

### errors

> **errors**: [`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md)[]

Defined in: [parser/src/parse.ts:46](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L46)

List of errors encountered during parsing.