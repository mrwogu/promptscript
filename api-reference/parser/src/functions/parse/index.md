# parse()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parse()

> **parse**(`source`, `options?`): [`ParseResult`](https://getpromptscript.dev/api-reference/parser/src/interfaces/ParseResult/index.md)

Defined in: [parser/src/parse.ts:193](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/parser/src/parse.ts#L193)

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