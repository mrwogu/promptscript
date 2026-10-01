# generateFactoryHooks()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: generateFactoryHooks()

> **generateFactoryHooks**(`hooks`): `Record`\<`string`, `unknown`[]\>

Defined in: [formatters/src/hook-adapters.ts:686](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/hook-adapters.ts#L686)

Generate Factory Droid hooks for .factory/hooks.json.
Factory uses a structure similar to Claude (event -> array of entries).

## Parameters

### hooks

[`HookDefinition`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookDefinition/index.md)[]

## Returns

`Record`\<`string`, `unknown`[]\>