# resolveAgentTargetPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveAgentTargetPath()

> **resolveAgentTargetPath**(`pathParts`, `agentsIndex`, `namespace`, `agentProperties`): `string`[] \| `undefined`

Defined in: [core/src/agent-names.ts:75](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/agent-names.ts#L75)

Resolve an agent property path after an `agents` target segment.

## Parameters

### pathParts

readonly `string`[]

### agentsIndex

`number`

### namespace

`string`

### agentProperties

`Readonly`\<`Record`\<`string`, [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)\>\>

## Returns

`string`[] \| `undefined`