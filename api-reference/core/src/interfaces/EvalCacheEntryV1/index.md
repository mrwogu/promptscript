# EvalCacheEntryV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCacheEntryV1

Defined in: [core/src/types/eval.ts:375](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L375)

One recorded model call of the eval cache, version 1. The file name is
the key, and the key is the SHA-256 of the canonical JSON of `request`.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/eval-cache-entry/v1.json"`

Defined in: [core/src/types/eval.ts:380](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L380)

Schema URL, the version tag of the entry.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-cache-entry/v1.json"
```

***

### key

> **key**: `string`

Defined in: [core/src/types/eval.ts:382](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L382)

Cache key

***

### request

> **request**: [`EvalCacheRequestV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheRequestV1/index.md)

Defined in: [core/src/types/eval.ts:384](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L384)

The request the entry answers

***

### response

> **response**: [`EvalCacheResponseV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheResponseV1/index.md)

Defined in: [core/src/types/eval.ts:386](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L386)

The recorded response