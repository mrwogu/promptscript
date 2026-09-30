# parseCanonicalFile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseCanonicalFile()

> **parseCanonicalFile**(`filePath`, `options?`): [`CanonicalParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)

Defined in: [parser/src/parse.ts:277](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/parser/src/parse.ts#L277)

Parse a PromptScript file from disk into the canonical AST.

## Parameters

### filePath

`string`

### options?

`Omit`\<[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md), `"filename"`\> = `{}`

## Returns

[`CanonicalParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/CanonicalParseResult/index.md)