# extractHooks()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractHooks()

> **extractHooks**(`hooksBlock`): [`HookDefinition`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookDefinition/index.md)[]

Defined in: [formatters/src/hook-adapters.ts:321](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/hook-adapters.ts#L321)

Extract hook definitions from a parsed

## Parameters

### hooksBlock

#### content

\{ `properties?`: `Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>; `type`: `string`; \}

#### content.properties?

`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>

#### content.type

`string`

## Returns

[`HookDefinition`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookDefinition/index.md)[]

## Hooks

block.