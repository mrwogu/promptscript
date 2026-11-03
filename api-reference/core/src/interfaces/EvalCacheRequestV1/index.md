# EvalCacheRequestV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCacheRequestV1

Defined in: [core/src/types/eval.ts:295](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L295)

The request a cache entry answers; the cache key is derived from it.

## Properties

### apiId

> **apiId**: `string`

Defined in: [core/src/types/eval.ts:322](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L322)

Provider API model identifier.

#### Example

```ts
"claude-sonnet-5-5"
```

***

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/eval.ts:300](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L300)

Content hash of the prompt bundle, or of the rubric for a judge call.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### inputsHash

> **inputsHash**: `string`

Defined in: [core/src/types/eval.ts:307](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L307)

Hash of the canonical JSON of the case inputs after validation and
defaults. For a judge call it is the hash of the rubric inputs without
`boundary`.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### modelRef

> **modelRef**: `string`

Defined in: [core/src/types/eval.ts:312](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L312)

Model reference as written in the suite or the prompt.

#### Example

```ts
"claude-sonnet-5-5"
```

***

### params

> **params**: [`ModelParams`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelParams/index.md)

Defined in: [core/src/types/eval.ts:324](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L324)

Effective parameters of the call, the output token cap included

***

### provider

> **provider**: `string`

Defined in: [core/src/types/eval.ts:317](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L317)

Provider name.

#### Example

```ts
"anthropic"
```

***

### sample

> **sample**: `number`

Defined in: [core/src/types/eval.ts:330](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L330)

Sample index: 0 for the case call, the run index for judge calls.

#### As Type

integer

#### Minimum

0