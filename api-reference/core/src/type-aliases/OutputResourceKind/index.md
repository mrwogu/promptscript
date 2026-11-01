# OutputResourceKind

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: OutputResourceKind

> **OutputResourceKind** = `"main"` \| `"skills"` \| `"agents"` \| `"commands"` \| `"hooks"` \| `"mcp"` \| `"plugins"`

Defined in: [core/src/output-resources.ts:20](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/output-resources.ts#L20)

Resource kinds a compile run can select.

`main` is the target's instruction surface (root instruction files, rules,
workflows, local memory); everything else matches the catalog resource
categories.