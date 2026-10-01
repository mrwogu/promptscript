# resolveAgentTargetPath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: resolveAgentTargetPath()

> **resolveAgentTargetPath**(`pathParts`, `agentsIndex`, `namespace`, `agentProperties`): `string`[] \| `undefined`

Defined in: [core/src/agent-names.ts:75](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/agent-names.ts#L75)

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