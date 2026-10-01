# PortableHookEvent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: PortableHookEvent

> **PortableHookEvent** = `"pre-terminal-command"` \| `"pre-tool-use"` \| `"post-tool-use"` \| `"session-start"` \| `"setup"` \| `"subagent-start"` \| `"notification"` \| `"stop"`

Defined in: [formatters/src/hook-adapters.ts:14](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/hook-adapters.ts#L14)

Portable hook event names (kebab-case).
These map to target-native event names per target contract.