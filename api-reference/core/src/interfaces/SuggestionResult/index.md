# SuggestionResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionResult

Defined in: [core/src/types/manifest.ts:187](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L187)

Result of applying suggestion rules to a project.

## Properties

### inherit?

> `optional` **inherit?**: `string`

Defined in: [core/src/types/manifest.ts:189](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L189)

Suggested configuration to inherit

***

### reasoning

> **reasoning**: [`SuggestionReasoning`](https://getpromptscript.dev/api-reference/core/src/interfaces/SuggestionReasoning/index.md)[]

Defined in: [core/src/types/manifest.ts:195](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L195)

Reasoning for each suggestion

***

### skills

> **skills**: `string`[]

Defined in: [core/src/types/manifest.ts:193](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L193)

Suggested skills to include

***

### use

> **use**: `string`[]

Defined in: [core/src/types/manifest.ts:191](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L191)

Suggested fragments to use