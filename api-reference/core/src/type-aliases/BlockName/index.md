# BlockName

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: BlockName

> **BlockName** = `"identity"` \| `"context"` \| `"standards"` \| `"restrictions"` \| `"knowledge"` \| `"shortcuts"` \| `"commands"` \| `"guards"` \| `"params"` \| `"skills"` \| `"agents"` \| `"local"` \| `"workflows"` \| `"prompts"` \| `"examples"` \| `string`

Defined in: [core/src/types/ast.ts:283](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/ast.ts#L283)

Block name type used in the AST.

Intentionally includes `| string` to allow custom block names beyond
the known set. The parser accepts any `@identifier` as a block name,
so the AST must accommodate arbitrary names. Use [BlockTypeName](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockTypeName/index.md)
(from `constants.ts`) when you need the strict set of known block types
for validation or exhaustive matching.