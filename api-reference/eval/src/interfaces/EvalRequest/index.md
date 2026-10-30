# EvalRequest

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalRequest

Defined in: [eval/src/provider.ts:10](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L10)

One model call a provider makes.

## Properties

### apiId

> **apiId**: `string`

Defined in: [eval/src/provider.ts:16](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L16)

Provider API model identifier

***

### maxOutputTokens

> **maxOutputTokens**: `number`

Defined in: [eval/src/provider.ts:26](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L26)

Output token cap, always set

***

### messages

> **messages**: readonly [`PromptBundleMessage`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleMessage/index.md)[]

Defined in: [eval/src/provider.ts:20](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L20)

Rendered messages, system first

***

### modelRef

> **modelRef**: `string`

Defined in: [eval/src/provider.ts:18](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L18)

Model reference as written in the suite or the prompt

***

### output?

> `optional` **output?**: [`PromptBundleOutput`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleOutput/index.md)

Defined in: [eval/src/provider.ts:24](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L24)

Output contract to request as structured output

***

### params

> **params**: [`ModelParams`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelParams/index.md)

Defined in: [eval/src/provider.ts:22](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L22)

Effective parameters

***

### promptId

> **promptId**: `string`

Defined in: [eval/src/provider.ts:12](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L12)

Id of the prompt under test

***

### provider

> **provider**: `string`

Defined in: [eval/src/provider.ts:14](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/provider.ts#L14)

Provider name, such as `anthropic`