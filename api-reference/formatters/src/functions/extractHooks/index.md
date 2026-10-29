# extractHooks()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: extractHooks()

> **extractHooks**(`hooksBlock`): [`HookDefinition`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookDefinition/index.md)[]

Defined in: [formatters/src/hook-adapters.ts:321](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/hook-adapters.ts#L321)

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