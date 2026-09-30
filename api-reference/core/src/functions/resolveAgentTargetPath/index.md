# resolveAgentTargetPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveAgentTargetPath()

> **resolveAgentTargetPath**(`pathParts`, `agentsIndex`, `namespace`, `agentProperties`): `string`[] \| `undefined`

Defined in: [core/src/agent-names.ts:75](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/agent-names.ts#L75)

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