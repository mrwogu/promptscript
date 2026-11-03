# OutputResourceKind

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: OutputResourceKind

> **OutputResourceKind** = `"main"` \| `"skills"` \| `"agents"` \| `"commands"` \| `"hooks"` \| `"mcp"` \| `"plugins"`

Defined in: [core/src/output-resources.ts:20](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/output-resources.ts#L20)

Resource kinds a compile run can select.

`main` is the target's instruction surface (root instruction files, rules,
workflows, local memory); everything else matches the catalog resource
categories.