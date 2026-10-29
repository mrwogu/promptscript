# PortableHookEvent

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: PortableHookEvent

> **PortableHookEvent** = `"pre-terminal-command"` \| `"pre-tool-use"` \| `"post-tool-use"` \| `"session-start"` \| `"setup"` \| `"subagent-start"` \| `"notification"` \| `"stop"`

Defined in: [formatters/src/hook-adapters.ts:14](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/hook-adapters.ts#L14)

Portable hook event names (kebab-case).
These map to target-native event names per target contract.