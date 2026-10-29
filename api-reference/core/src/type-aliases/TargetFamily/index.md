# TargetFamily

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: TargetFamily

> **TargetFamily** = `"base"` \| `"markdown-instruction"` \| `"simple"` \| `"agents-md-only"` \| `"prompt"`

Defined in: [core/src/target-catalog.ts:33](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-catalog.ts#L33)

Target family classification.
- `base`: Formatters extending BaseFormatter directly (GitHub, Cursor, Claude, Antigravity)
- `markdown-instruction`: Formatters extending MarkdownInstructionFormatter
- `simple`: Formatters created via createSimpleMarkdownFormatter
- `agents-md-only`: Targets using the project-local AGENTS.md contract
- `prompt`: Application prompt targets, opt-in only, never part of an "all formatters" default