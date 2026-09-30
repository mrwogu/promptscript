# makeBlock()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: makeBlock()

> **makeBlock**(`name`, `content`, `file?`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)

Defined in: [resolver/src/ast-factory.ts:60](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/ast-factory.ts#L60)

Synthesize a Block node.

## Parameters

### name

`string`

Block name

### content

[`TextContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextContent/index.md) \| [`ObjectContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectContent/index.md)

Block content

### file?

`string`

Optional source file for the loc; falls back to VIRTUAL_LOC

## Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)