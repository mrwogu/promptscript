# generateCursorHooks()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: generateCursorHooks()

> **generateCursorHooks**(`hooks`): `Record`\<`string`, `unknown`\>

Defined in: [formatters/src/hook-adapters.ts:662](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/hook-adapters.ts#L662)

Generate Cursor hooks.json entries from portable hook definitions.

Cursor uses a flat JSON structure keyed by event name.

## Parameters

### hooks

[`HookDefinition`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookDefinition/index.md)[]

## Returns

`Record`\<`string`, `unknown`\>