# GithubVersion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: GithubVersion

> **GithubVersion** = `"simple"` \| `"multifile"` \| `"full"`

Defined in: [core/src/types/config.ts:53](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/types/config.ts#L53)

GitHub Copilot output format versions.
- `simple`: Single file output (.github/copilot-instructions.md)
- `multifile`: Main + path-specific instructions + prompts
- `full`: Multifile + skills + AGENTS.md