# getAgentFieldSupport()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getAgentFieldSupport()

> **getAgentFieldSupport**(`target`): `Readonly`\<`Record`\<[`CanonicalAgentField`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CanonicalAgentField/index.md), [`AgentFieldStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/AgentFieldStatus/index.md)\>\>

Defined in: [core/src/agent-capabilities.ts:144](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/agent-capabilities.ts#L144)

Return every canonical field status for one target.

Targets without native agent output still report a full `not-supported`
record so consumers can render complete matrices.

## Parameters

### target

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

## Returns

`Readonly`\<`Record`\<[`CanonicalAgentField`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CanonicalAgentField/index.md), [`AgentFieldStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/AgentFieldStatus/index.md)\>\>