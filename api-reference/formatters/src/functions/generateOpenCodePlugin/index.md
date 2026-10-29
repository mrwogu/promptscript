# generateOpenCodePlugin()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: generateOpenCodePlugin()

> **generateOpenCodePlugin**(`hooks`): `string` \| `null`

Defined in: [formatters/src/hook-adapters.ts:1292](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/hook-adapters.ts#L1292)

Generate the project-local OpenCode plugin for portable hook definitions.

Returns the plugin source, or null when no enabled hook maps to an OpenCode
tool execution event. Output is deterministic for equal hook input.

## Parameters

### hooks

[`HookDefinition`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/HookDefinition/index.md)[]

## Returns

`string` \| `null`