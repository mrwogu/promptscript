# listAgentFieldSupportTargets()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listAgentFieldSupportTargets()

> **listAgentFieldSupportTargets**(`field`): [`AgentFieldTargetSupport`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentFieldTargetSupport/index.md)

Defined in: [core/src/agent-capabilities.ts:163](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/agent-capabilities.ts#L163)

List native targets that can represent one canonical agent field.

## Parameters

### field

`"content"` \| `"skills"` \| `"mcpServers"` \| `"description"` \| `"handoffs"` \| `"model"` \| `"tools"` \| `"reasoningEffort"` \| `"specModel"` \| `"specReasoningEffort"` \| `"disallowedTools"` \| `"permissionMode"` \| `"sandboxMode"` \| `"nicknameCandidates"` \| `"maxTurns"` \| `"memory"` \| `"background"` \| `"isolation"`

## Returns

[`AgentFieldTargetSupport`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentFieldTargetSupport/index.md)