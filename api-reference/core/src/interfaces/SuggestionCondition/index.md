# SuggestionCondition

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionCondition

Defined in: [core/src/types/manifest.ts:89](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L89)

Condition for triggering a suggestion rule.

## Properties

### always?

> `optional` **always?**: `boolean`

Defined in: [core/src/types/manifest.ts:91](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L91)

Always match

***

### dependencies?

> `optional` **dependencies?**: `string`[]

Defined in: [core/src/types/manifest.ts:95](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L95)

Match if any of these dependencies are present

***

### files?

> `optional` **files?**: `string`[]

Defined in: [core/src/types/manifest.ts:93](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L93)

Match if any of these files exist

***

### frameworks?

> `optional` **frameworks?**: `string`[]

Defined in: [core/src/types/manifest.ts:99](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L99)

Match if any of these frameworks are detected

***

### languages?

> `optional` **languages?**: `string`[]

Defined in: [core/src/types/manifest.ts:97](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L97)

Match if any of these languages are detected