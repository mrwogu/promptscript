# SuggestionReasoning

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionReasoning

Defined in: [core/src/types/manifest.ts:201](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L201)

Explanation for why a suggestion was made.

## Properties

### matchedValue?

> `optional` **matchedValue?**: `string`

Defined in: [core/src/types/manifest.ts:209](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L209)

The specific value that matched (file name, dependency, etc.)

***

### reason

> **reason**: `string`

Defined in: [core/src/types/manifest.ts:205](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L205)

Why it was suggested

***

### suggestion

> **suggestion**: `string`

Defined in: [core/src/types/manifest.ts:203](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L203)

The suggestion that was made

***

### trigger

> **trigger**: `"file"` \| `"always"` \| `"dependency"` \| `"language"` \| `"framework"`

Defined in: [core/src/types/manifest.ts:207](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/manifest.ts#L207)

What triggered the suggestion