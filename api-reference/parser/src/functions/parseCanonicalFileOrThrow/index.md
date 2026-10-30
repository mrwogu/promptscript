# parseCanonicalFileOrThrow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseCanonicalFileOrThrow()

> **parseCanonicalFileOrThrow**(`filePath`, `options?`): [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

Defined in: [parser/src/parse.ts:354](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/parser/src/parse.ts#L354)

Parse a PromptScript file into the canonical AST, throwing on error.

## Parameters

### filePath

`string`

### options?

`Omit`\<[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md), `"filename"`\> = `{}`

## Returns

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)