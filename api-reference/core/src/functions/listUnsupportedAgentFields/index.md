# listUnsupportedAgentFields()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listUnsupportedAgentFields()

> **listUnsupportedAgentFields**(`target`, `fields`): (`"content"` \| `"skills"` \| `"mcpServers"` \| `"description"` \| `"handoffs"` \| `"model"` \| `"tools"` \| `"reasoningEffort"` \| `"specModel"` \| `"specReasoningEffort"` \| `"disallowedTools"` \| `"permissionMode"` \| `"sandboxMode"` \| `"nicknameCandidates"` \| `"maxTurns"` \| `"memory"` \| `"background"` \| `"isolation"`)[]

Defined in: [core/src/agent-capabilities.ts:174](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/agent-capabilities.ts#L174)

List canonical fields a target cannot represent.

Non-canonical authored fields are always unsupported; callers detect them
by checking membership in [CANONICAL\_AGENT\_FIELDS](https://getpromptscript.dev/api-reference/core/src/variables/CANONICAL_AGENT_FIELDS/index.md) first.

## Parameters

### target

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

### fields

readonly `string`[]

## Returns

(`"content"` \| `"skills"` \| `"mcpServers"` \| `"description"` \| `"handoffs"` \| `"model"` \| `"tools"` \| `"reasoningEffort"` \| `"specModel"` \| `"specReasoningEffort"` \| `"disallowedTools"` \| `"permissionMode"` \| `"sandboxMode"` \| `"nicknameCandidates"` \| `"maxTurns"` \| `"memory"` \| `"background"` \| `"isolation"`)[]