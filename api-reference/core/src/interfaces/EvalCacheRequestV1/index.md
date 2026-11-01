# EvalCacheRequestV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCacheRequestV1

Defined in: [core/src/types/eval.ts:287](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L287)

The request a cache entry answers; the cache key is derived from it.

## Properties

### apiId

> **apiId**: `string`

Defined in: [core/src/types/eval.ts:314](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L314)

Provider API model identifier.

#### Example

```ts
"claude-sonnet-5-5"
```

***

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/eval.ts:292](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L292)

Content hash of the prompt bundle, or of the rubric for a judge call.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### inputsHash

> **inputsHash**: `string`

Defined in: [core/src/types/eval.ts:299](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L299)

Hash of the canonical JSON of the case inputs after validation and
defaults. For a judge call it is the hash of the rubric inputs without
`boundary`.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### modelRef

> **modelRef**: `string`

Defined in: [core/src/types/eval.ts:304](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L304)

Model reference as written in the suite or the prompt.

#### Example

```ts
"claude-sonnet-5-5"
```

***

### params

> **params**: [`ModelParams`](https://getpromptscript.dev/api-reference/core/src/interfaces/ModelParams/index.md)

Defined in: [core/src/types/eval.ts:316](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L316)

Effective parameters of the call, the output token cap included

***

### provider

> **provider**: `string`

Defined in: [core/src/types/eval.ts:309](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L309)

Provider name.

#### Example

```ts
"anthropic"
```

***

### sample

> **sample**: `number`

Defined in: [core/src/types/eval.ts:322](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L322)

Sample index: 0 for the case call, the run index for judge calls.

#### As Type

integer

#### Minimum

0