# EvalCacheUseV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCacheUseV1

Defined in: [core/src/types/eval.ts:409](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L409)

How many calls came from the cache and how many went to a provider.

## Extended by

- [`EvalReportCacheV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportCacheV1/index.md)

## Properties

### live

> **live**: `number`

Defined in: [core/src/types/eval.ts:421](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L421)

Calls made to a provider.

#### As Type

integer

#### Minimum

0

***

### replayed

> **replayed**: `number`

Defined in: [core/src/types/eval.ts:415](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L415)

Calls answered from the cache.

#### As Type

integer

#### Minimum

0