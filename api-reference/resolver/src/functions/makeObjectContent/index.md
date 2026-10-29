# makeObjectContent()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: makeObjectContent()

> **makeObjectContent**(`properties`, `file?`): [`ObjectContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectContent/index.md)

Defined in: [resolver/src/ast-factory.ts:31](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/ast-factory.ts#L31)

Synthesize an ObjectContent node from a properties record.

## Parameters

### properties

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

Property values keyed by name

### file?

`string`

Optional source file for the loc; falls back to VIRTUAL_LOC

## Returns

[`ObjectContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectContent/index.md)