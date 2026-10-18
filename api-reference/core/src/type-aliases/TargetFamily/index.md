# TargetFamily

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TargetFamily

> **TargetFamily** = `"base"` \| `"markdown-instruction"` \| `"simple"` \| `"agents-md-only"`

Defined in: [core/src/target-catalog.ts:31](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/target-catalog.ts#L31)

Target family classification.
- `base`: Formatters extending BaseFormatter directly (GitHub, Cursor, Claude, Antigravity)
- `markdown-instruction`: Formatters extending MarkdownInstructionFormatter
- `simple`: Formatters created via createSimpleMarkdownFormatter
- `agents-md-only`: Targets using the project-local AGENTS.md contract