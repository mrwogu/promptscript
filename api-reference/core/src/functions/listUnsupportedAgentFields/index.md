# listUnsupportedAgentFields()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: listUnsupportedAgentFields()

> **listUnsupportedAgentFields**(`target`, `fields`): (`"content"` \| `"skills"` \| `"mcpServers"` \| `"handoffs"` \| `"description"` \| `"tools"` \| `"model"` \| `"reasoningEffort"` \| `"specModel"` \| `"specReasoningEffort"` \| `"disallowedTools"` \| `"permissionMode"` \| `"sandboxMode"` \| `"nicknameCandidates"` \| `"maxTurns"` \| `"memory"` \| `"background"` \| `"isolation"`)[]

Defined in: [core/src/agent-capabilities.ts:174](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/agent-capabilities.ts#L174)

List canonical fields a target cannot represent.

Non-canonical authored fields are always unsupported; callers detect them
by checking membership in [CANONICAL\_AGENT\_FIELDS](https://getpromptscript.dev/api-reference/core/src/variables/CANONICAL_AGENT_FIELDS/index.md) first.

## Parameters

### target

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

### fields

readonly `string`[]

## Returns

(`"content"` \| `"skills"` \| `"mcpServers"` \| `"handoffs"` \| `"description"` \| `"tools"` \| `"model"` \| `"reasoningEffort"` \| `"specModel"` \| `"specReasoningEffort"` \| `"disallowedTools"` \| `"permissionMode"` \| `"sandboxMode"` \| `"nicknameCandidates"` \| `"maxTurns"` \| `"memory"` \| `"background"` \| `"isolation"`)[]