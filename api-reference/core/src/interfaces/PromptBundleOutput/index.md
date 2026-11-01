# PromptBundleOutput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleOutput

Defined in: [core/src/types/prompt-bundle.ts:48](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L48)

Output contract of a prompt bundle, a JSON Schema subset.

## Properties

### additionalProperties

> **additionalProperties**: `false`

Defined in: [core/src/types/prompt-bundle.ts:56](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L56)

Always false

***

### properties

> **properties**: `Record`\<`string`, [`PromptBundleOutputProperty`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleOutputProperty/index.md)\>

Defined in: [core/src/types/prompt-bundle.ts:52](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L52)

Properties by name

***

### required

> **required**: `string`[]

Defined in: [core/src/types/prompt-bundle.ts:54](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L54)

Names of required properties, sorted. All properties are required.

***

### type

> **type**: `"object"`

Defined in: [core/src/types/prompt-bundle.ts:50](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/prompt-bundle.ts#L50)

Always `object`