# listAgentFieldSupportTargets()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listAgentFieldSupportTargets()

> **listAgentFieldSupportTargets**(`field`): [`AgentFieldTargetSupport`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentFieldTargetSupport/index.md)

Defined in: [core/src/agent-capabilities.ts:163](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/agent-capabilities.ts#L163)

List native targets that can represent one canonical agent field.

## Parameters

### field

`"content"` \| `"skills"` \| `"mcpServers"` \| `"description"` \| `"handoffs"` \| `"model"` \| `"tools"` \| `"reasoningEffort"` \| `"specModel"` \| `"specReasoningEffort"` \| `"disallowedTools"` \| `"permissionMode"` \| `"sandboxMode"` \| `"nicknameCandidates"` \| `"maxTurns"` \| `"memory"` \| `"background"` \| `"isolation"`

## Returns

[`AgentFieldTargetSupport`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentFieldTargetSupport/index.md)