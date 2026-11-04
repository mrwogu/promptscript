# GithubVersion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: GithubVersion

> **GithubVersion** = `"simple"` \| `"multifile"` \| `"full"`

Defined in: [core/src/types/config.ts:62](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L62)

GitHub Copilot output format versions.
- `simple`: Single file output (.github/copilot-instructions.md)
- `multifile`: Main + path-specific instructions + prompts
- `full`: Multifile + skills + AGENTS.md