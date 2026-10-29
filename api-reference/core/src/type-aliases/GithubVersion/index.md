# GithubVersion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: GithubVersion

> **GithubVersion** = `"simple"` \| `"multifile"` \| `"full"`

Defined in: [core/src/types/config.ts:53](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L53)

GitHub Copilot output format versions.
- `simple`: Single file output (.github/copilot-instructions.md)
- `multifile`: Main + path-specific instructions + prompts
- `full`: Multifile + skills + AGENTS.md