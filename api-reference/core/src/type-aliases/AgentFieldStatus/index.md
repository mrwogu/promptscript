# AgentFieldStatus

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: AgentFieldStatus

> **AgentFieldStatus** = `"emitted"` \| `"transformed"` \| `"not-supported"`

Defined in: [core/src/agent-capabilities.ts:46](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/agent-capabilities.ts#L46)

How a target handles a canonical agent field:
- `emitted`: written to the native agent file under the same name
- `transformed`: written under a target-native name or representation
- `not-supported`: the native agent format cannot represent it