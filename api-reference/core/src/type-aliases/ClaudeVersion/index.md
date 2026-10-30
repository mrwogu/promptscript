# ClaudeVersion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: ClaudeVersion

> **ClaudeVersion** = `"simple"` \| `"multifile"` \| `"full"`

Defined in: [core/src/types/config.ts:61](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/config.ts#L61)

Claude Code output format versions.
- `simple`: Single file output (CLAUDE.md)
- `multifile`: Main + modular rules (.claude/rules/*.md)
- `full`: Multifile + skills + local memory