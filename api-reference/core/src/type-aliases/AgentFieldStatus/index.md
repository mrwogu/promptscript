# AgentFieldStatus

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: AgentFieldStatus

> **AgentFieldStatus** = `"emitted"` \| `"transformed"` \| `"not-supported"`

Defined in: [core/src/agent-capabilities.ts:46](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/agent-capabilities.ts#L46)

How a target handles a canonical agent field:
- `emitted`: written to the native agent file under the same name
- `transformed`: written under a target-native name or representation
- `not-supported`: the native agent format cannot represent it