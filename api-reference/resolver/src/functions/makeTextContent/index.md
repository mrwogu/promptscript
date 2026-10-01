# makeTextContent()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: makeTextContent()

> **makeTextContent**(`value`, `file?`): [`TextContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextContent/index.md)

Defined in: [resolver/src/ast-factory.ts:45](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/ast-factory.ts#L45)

Synthesize a TextContent node.

## Parameters

### value

`string`

The text value

### file?

`string`

Optional file path for the loc; falls back to VIRTUAL_LOC

## Returns

[`TextContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/TextContent/index.md)