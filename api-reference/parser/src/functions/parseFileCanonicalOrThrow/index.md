# parseFileCanonicalOrThrow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseFileCanonicalOrThrow()

> **parseFileCanonicalOrThrow**(`filePath`, `options?`): [`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)

Defined in: [parser/src/parse.ts:368](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L368)

Compatibility alias for parseCanonicalFileOrThrow.

## Parameters

### filePath

`string`

### options?

`Omit`\<[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md), `"filename"`\> = `{}`

## Returns

[`CanonicalProgram`](https://getpromptscript.dev/api-reference/core/src/interfaces/CanonicalProgram/index.md)