# EvalCacheKey

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EvalCacheKey

> **EvalCacheKey** = `string`

Defined in: [core/src/types/eval.ts:338](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L338)

Cache key: the SHA-256 of the canonical JSON of a cache request, 64
lowercase hex characters.

## Pattern

^[0-9a-f]{64}$