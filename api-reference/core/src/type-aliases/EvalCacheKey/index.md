# EvalCacheKey

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EvalCacheKey

> **EvalCacheKey** = `string`

Defined in: [core/src/types/eval.ts:330](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L330)

Cache key: the SHA-256 of the canonical JSON of a cache request, 64
lowercase hex characters.

## Pattern

^[0-9a-f]{64}$