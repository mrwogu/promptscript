# parseFileCanonicalOrThrow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseFileCanonicalOrThrow()

> **parseFileCanonicalOrThrow**(`filePath`, `options?`): [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

Defined in: [parser/src/parse.ts:368](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/parser/src/parse.ts#L368)

Compatibility alias for parseCanonicalFileOrThrow.

## Parameters

### filePath

`string`

### options?

`Omit`\<[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md), `"filename"`\> = `{}`

## Returns

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)