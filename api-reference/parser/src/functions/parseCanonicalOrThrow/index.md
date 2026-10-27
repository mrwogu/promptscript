# parseCanonicalOrThrow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseCanonicalOrThrow()

> **parseCanonicalOrThrow**(`source`, `options?`): [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

Defined in: [parser/src/parse.ts:205](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L205)

Parse PromptScript source code into the canonical AST, throwing on error.

## Parameters

### source

`string`

### options?

[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md)

## Returns

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)