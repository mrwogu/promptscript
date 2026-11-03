# PromptComposition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptComposition

Defined in: [core/src/types/prompts.ts:91](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/prompts.ts#L91)

The blocks one prompt composed into its system message, and the files they came from.

## Properties

### blocks

> **blocks**: `object`[]

Defined in: [core/src/types/prompts.ts:95](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/prompts.ts#L95)

Composed blocks in composition order

#### block

> **block**: [`ComposableBlock`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ComposableBlock/index.md)

#### files

> **files**: `string`[]

***

### prompt

> **prompt**: `string`

Defined in: [core/src/types/prompts.ts:93](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/prompts.ts#L93)

Prompt id, `<@meta.id>/<key>`