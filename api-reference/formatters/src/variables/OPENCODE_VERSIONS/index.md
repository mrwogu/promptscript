# OPENCODE_VERSIONS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: OPENCODE\_VERSIONS

> `const` **OPENCODE\_VERSIONS**: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

Defined in: [formatters/src/formatters/opencode.ts:21](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/formatters/src/formatters/opencode.ts#L21)

OpenCode formatter version information.

Descriptions mirror what the formatter actually emits: skill and agent
files are full-mode-only, command files appear from multifile mode on, and
the PromptScript lifecycle plugin is emitted in multifile and full modes.