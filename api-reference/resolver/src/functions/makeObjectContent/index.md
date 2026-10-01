# makeObjectContent()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: makeObjectContent()

> **makeObjectContent**(`properties`, `file?`): [`ObjectContent`](https://getpromptscript.dev/api-reference/core/src/interfaces/ObjectContent/index.md)

Defined in: [resolver/src/ast-factory.ts:31](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/ast-factory.ts#L31)

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