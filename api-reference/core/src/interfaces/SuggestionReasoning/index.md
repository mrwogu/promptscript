# SuggestionReasoning

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SuggestionReasoning

Defined in: [core/src/types/manifest.ts:195](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/manifest.ts#L195)

Explanation for why a suggestion was made.

## Properties

### matchedValue?

> `optional` **matchedValue?**: `string`

Defined in: [core/src/types/manifest.ts:203](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/manifest.ts#L203)

The specific value that matched (file name, dependency, etc.)

***

### reason

> **reason**: `string`

Defined in: [core/src/types/manifest.ts:199](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/manifest.ts#L199)

Why it was suggested

***

### suggestion

> **suggestion**: `string`

Defined in: [core/src/types/manifest.ts:197](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/manifest.ts#L197)

The suggestion that was made

***

### trigger

> **trigger**: `"file"` \| `"always"` \| `"dependency"` \| `"language"` \| `"framework"`

Defined in: [core/src/types/manifest.ts:201](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/manifest.ts#L201)

What triggered the suggestion