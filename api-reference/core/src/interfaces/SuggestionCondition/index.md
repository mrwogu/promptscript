# SuggestionCondition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionCondition

Defined in: [core/src/types/manifest.ts:83](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/manifest.ts#L83)

Condition for triggering a suggestion rule.

## Properties

### always?

> `optional` **always?**: `boolean`

Defined in: [core/src/types/manifest.ts:85](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/manifest.ts#L85)

Always match

***

### dependencies?

> `optional` **dependencies?**: `string`[]

Defined in: [core/src/types/manifest.ts:89](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/manifest.ts#L89)

Match if any of these dependencies are present

***

### files?

> `optional` **files?**: `string`[]

Defined in: [core/src/types/manifest.ts:87](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/manifest.ts#L87)

Match if any of these files exist

***

### frameworks?

> `optional` **frameworks?**: `string`[]

Defined in: [core/src/types/manifest.ts:93](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/manifest.ts#L93)

Match if any of these frameworks are detected

***

### languages?

> `optional` **languages?**: `string`[]

Defined in: [core/src/types/manifest.ts:91](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/manifest.ts#L91)

Match if any of these languages are detected