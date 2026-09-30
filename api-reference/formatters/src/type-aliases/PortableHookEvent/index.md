# PortableHookEvent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: PortableHookEvent

> **PortableHookEvent** = `"pre-terminal-command"` \| `"pre-tool-use"` \| `"post-tool-use"` \| `"session-start"` \| `"setup"` \| `"subagent-start"` \| `"notification"` \| `"stop"`

Defined in: [formatters/src/hook-adapters.ts:14](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/hook-adapters.ts#L14)

Portable hook event names (kebab-case).
These map to target-native event names per target contract.