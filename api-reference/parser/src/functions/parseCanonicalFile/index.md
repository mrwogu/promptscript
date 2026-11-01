# parseCanonicalFile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseCanonicalFile()

> **parseCanonicalFile**(`filePath`, `options?`): [`CanonicalParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)

Defined in: [parser/src/parse.ts:285](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/parser/src/parse.ts#L285)

Parse a PromptScript file from disk into the canonical AST.

## Parameters

### filePath

`string`

### options?

`Omit`\<[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md), `"filename"`\> = `{}`

## Returns

[`CanonicalParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)