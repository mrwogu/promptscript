# EvalReportCacheV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalReportCacheV1

Defined in: [core/src/types/eval.ts:425](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L425)

Cache summary of a run.

## Extends

- [`EvalCacheUseV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheUseV1/index.md)

## Properties

### digest

> **digest**: `string`

Defined in: [core/src/types/eval.ts:436](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L436)

Digest of the consumed cache entries. Take the unique keys of every
case's `cacheKeys`, sorted ascending; for each key the lowercase hex
SHA-256 of its entry file bytes; join those with `\n` and take the
SHA-256 of the result. An empty set gives the SHA-256 of the empty
string.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### live

> **live**: `number`

Defined in: [core/src/types/eval.ts:421](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L421)

Calls made to a provider.

#### As Type

integer

#### Minimum

0

#### Inherited from

[`EvalCacheUseV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheUseV1/index.md).[`live`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheUseV1/index.md#live)

***

### mode

> **mode**: [`EvalCacheMode`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCacheMode/index.md)

Defined in: [core/src/types/eval.ts:427](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L427)

Cache mode of the run

***

### replayed

> **replayed**: `number`

Defined in: [core/src/types/eval.ts:415](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L415)

Calls answered from the cache.

#### As Type

integer

#### Minimum

0

#### Inherited from

[`EvalCacheUseV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheUseV1/index.md).[`replayed`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheUseV1/index.md#replayed)