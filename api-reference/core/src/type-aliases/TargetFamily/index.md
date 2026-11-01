# TargetFamily

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TargetFamily

> **TargetFamily** = `"base"` \| `"markdown-instruction"` \| `"simple"` \| `"agents-md-only"` \| `"prompt"`

Defined in: [core/src/target-catalog.ts:33](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-catalog.ts#L33)

Target family classification.
- `base`: Formatters extending BaseFormatter directly (GitHub, Cursor, Claude, Antigravity)
- `markdown-instruction`: Formatters extending MarkdownInstructionFormatter
- `simple`: Formatters created via createSimpleMarkdownFormatter
- `agents-md-only`: Targets using the project-local AGENTS.md contract
- `prompt`: Application prompt targets, opt-in only, never part of an "all formatters" default