# parseCanonicalOrThrow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseCanonicalOrThrow()

> **parseCanonicalOrThrow**(`source`, `options?`): [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

Defined in: [parser/src/parse.ts:205](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L205)

Parse PromptScript source code into the canonical AST, throwing on error.

## Parameters

### source

`string`

### options?

[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md)

## Returns

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)