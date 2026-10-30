# PromptComposition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptComposition

Defined in: [core/src/types/prompts.ts:87](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompts.ts#L87)

The blocks one prompt composed into its system message, and the files they came from.

## Properties

### blocks

> **blocks**: `object`[]

Defined in: [core/src/types/prompts.ts:91](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompts.ts#L91)

Composed blocks in composition order

#### block

> **block**: [`ComposableBlock`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ComposableBlock/index.md)

#### files

> **files**: `string`[]

***

### prompt

> **prompt**: `string`

Defined in: [core/src/types/prompts.ts:89](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompts.ts#L89)

Prompt id, `<@meta.id>/<key>`