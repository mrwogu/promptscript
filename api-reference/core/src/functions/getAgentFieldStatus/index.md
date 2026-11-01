# getAgentFieldStatus()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getAgentFieldStatus()

> **getAgentFieldStatus**(`target`, `field`): [`AgentFieldStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/AgentFieldStatus/index.md)

Defined in: [core/src/agent-capabilities.ts:131](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/agent-capabilities.ts#L131)

Return the capability status of one canonical agent field on a target.

Targets without native agent output report `not-supported` for every field.

## Parameters

### target

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

### field

`"content"` \| `"skills"` \| `"mcpServers"` \| `"description"` \| `"handoffs"` \| `"model"` \| `"tools"` \| `"reasoningEffort"` \| `"specModel"` \| `"specReasoningEffort"` \| `"disallowedTools"` \| `"permissionMode"` \| `"sandboxMode"` \| `"nicknameCandidates"` \| `"maxTurns"` \| `"memory"` \| `"background"` \| `"isolation"`

## Returns

[`AgentFieldStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/AgentFieldStatus/index.md)