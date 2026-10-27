# resolveAgentTargetPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveAgentTargetPath()

> **resolveAgentTargetPath**(`pathParts`, `agentsIndex`, `namespace`, `agentProperties`): `string`[] \| `undefined`

Defined in: [core/src/agent-names.ts:75](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/agent-names.ts#L75)

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