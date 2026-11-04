# ClaudeVersion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: ClaudeVersion

> **ClaudeVersion** = `"simple"` \| `"multifile"` \| `"full"`

Defined in: [core/src/types/config.ts:70](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/config.ts#L70)

Claude Code output format versions.
- `simple`: Single file output (CLAUDE.md)
- `multifile`: Main + modular rules (.claude/rules/*.md)
- `full`: Multifile + skills + local memory