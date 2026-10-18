# listAgentFieldSupportTargets()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listAgentFieldSupportTargets()

> **listAgentFieldSupportTargets**(`field`): [`AgentFieldTargetSupport`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentFieldTargetSupport/index.md)

Defined in: [core/src/agent-capabilities.ts:163](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/agent-capabilities.ts#L163)

List native targets that can represent one canonical agent field.

## Parameters

### field

`"content"` \| `"skills"` \| `"mcpServers"` \| `"handoffs"` \| `"description"` \| `"tools"` \| `"model"` \| `"reasoningEffort"` \| `"specModel"` \| `"specReasoningEffort"` \| `"disallowedTools"` \| `"permissionMode"` \| `"sandboxMode"` \| `"nicknameCandidates"` \| `"maxTurns"` \| `"memory"` \| `"background"` \| `"isolation"`

## Returns

[`AgentFieldTargetSupport`](https://getpromptscript.dev/api-reference/core/src/interfaces/AgentFieldTargetSupport/index.md)