# OPENCODE_VERSIONS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: OPENCODE\_VERSIONS

> `const` **OPENCODE\_VERSIONS**: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

Defined in: [formatters/src/formatters/opencode.ts:21](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/formatters/opencode.ts#L21)

OpenCode formatter version information.

Descriptions mirror what the formatter actually emits: skill and agent
files are full-mode-only, command files appear from multifile mode on, and
the PromptScript lifecycle plugin is emitted in multifile and full modes.