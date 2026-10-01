# OPENCODE_VERSIONS

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: OPENCODE\_VERSIONS

> `const` **OPENCODE\_VERSIONS**: [`SimpleFormatterVersions`](https://getpromptscript.dev/api-reference/formatters/src/interfaces/SimpleFormatterVersions/index.md)

Defined in: [formatters/src/formatters/opencode.ts:21](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/formatters/opencode.ts#L21)

OpenCode formatter version information.

Descriptions mirror what the formatter actually emits: skill and agent
files are full-mode-only, command files appear from multifile mode on, and
the PromptScript lifecycle plugin is emitted in multifile and full modes.