# CanonicalParseResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: CanonicalParseResult

Defined in: [parser/src/parse.ts:52](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/parser/src/parse.ts#L52)

Result of parsing PromptScript into the immutable canonical AST.

## Properties

### ast

> **ast**: [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md) \| `null`

Defined in: [parser/src/parse.ts:54](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/parser/src/parse.ts#L54)

The canonical AST, or null if parsing failed with tolerant=false.

***

### errors

> **errors**: [`ParseError`](https://getpromptscript.dev/api-reference/core/src/classes/ParseError/index.md)[]

Defined in: [parser/src/parse.ts:56](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/parser/src/parse.ts#L56)

List of errors encountered during parsing.