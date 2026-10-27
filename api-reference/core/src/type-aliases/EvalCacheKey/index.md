# EvalCacheKey

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EvalCacheKey

> **EvalCacheKey** = `string`

Defined in: [core/src/types/eval.ts:330](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L330)

Cache key: the SHA-256 of the canonical JSON of a cache request, 64
lowercase hex characters.

## Pattern

^[0-9a-f]{64}$