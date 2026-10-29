# EvalCacheKey

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EvalCacheKey

> **EvalCacheKey** = `string`

Defined in: [core/src/types/eval.ts:330](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L330)

Cache key: the SHA-256 of the canonical JSON of a cache request, 64
lowercase hex characters.

## Pattern

^[0-9a-f]{64}$