# getAgentFieldSupport()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getAgentFieldSupport()

> **getAgentFieldSupport**(`target`): `Readonly`\<`Record`\<[`CanonicalAgentField`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CanonicalAgentField/index.md), [`AgentFieldStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/AgentFieldStatus/index.md)\>\>

Defined in: [core/src/agent-capabilities.ts:144](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/agent-capabilities.ts#L144)

Return every canonical field status for one target.

Targets without native agent output still report a full `not-supported`
record so consumers can render complete matrices.

## Parameters

### target

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

## Returns

`Readonly`\<`Record`\<[`CanonicalAgentField`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CanonicalAgentField/index.md), [`AgentFieldStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/AgentFieldStatus/index.md)\>\>