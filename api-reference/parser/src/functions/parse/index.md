# parse()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parse()

> **parse**(`source`, `options?`): [`ParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseResult/index.md)

Defined in: [parser/src/parse.ts:193](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/parser/src/parse.ts#L193)

Parse PromptScript source code into the mutable legacy AST.

The returned graph is detached from the canonical parser output so existing
consumers may continue to mutate it during the compatibility window.

## Parameters

### source

`string`

### options?

[`ParseOptions`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseOptions/index.md) = `{}`

## Returns

[`ParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseResult/index.md)