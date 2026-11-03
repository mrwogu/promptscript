# EvalCacheEntryV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCacheEntryV1

Defined in: [core/src/types/eval.ts:383](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L383)

One recorded model call of the eval cache, version 1. The file name is
the key, and the key is the SHA-256 of the canonical JSON of `request`.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/eval-cache-entry/v1.json"`

Defined in: [core/src/types/eval.ts:388](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L388)

Schema URL, the version tag of the entry.

#### Example

```ts
"https://getpromptscript.dev/schema/eval-cache-entry/v1.json"
```

***

### key

> **key**: `string`

Defined in: [core/src/types/eval.ts:390](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L390)

Cache key

***

### request

> **request**: [`EvalCacheRequestV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheRequestV1/index.md)

Defined in: [core/src/types/eval.ts:392](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L392)

The request the entry answers

***

### response

> **response**: [`EvalCacheResponseV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheResponseV1/index.md)

Defined in: [core/src/types/eval.ts:394](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L394)

The recorded response