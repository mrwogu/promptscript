# validateAgentFieldMatrix()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateAgentFieldMatrix()

> **validateAgentFieldMatrix**(`groups?`, `nativeTargets?`): `string`[]

Defined in: [core/src/agent-capabilities.ts:202](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/agent-capabilities.ts#L202)

Consistency issues in an agent field matrix.

Every catalog target with an `agents` resource must have at least one
emitted field, and every matrix status group must only name targets that
actually have native agent output. Inputs are injectable so tests can
validate broken fixtures, mirroring validateTargetCapabilities.

## Parameters

### groups?

[`AgentFieldMatrix`](https://getpromptscript.dev/api-reference/core/src/type-aliases/AgentFieldMatrix/index.md) = `AGENT_FIELD_STATUS_GROUPS`

### nativeTargets?

readonly [`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)[] = `...`

## Returns

`string`[]