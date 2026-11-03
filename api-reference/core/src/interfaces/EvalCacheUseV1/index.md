# EvalCacheUseV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCacheUseV1

Defined in: [core/src/types/eval.ts:429](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L429)

How many calls came from the cache and how many went to a provider.

## Extended by

- [`EvalReportCacheV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportCacheV1/index.md)

## Properties

### live

> **live**: `number`

Defined in: [core/src/types/eval.ts:441](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L441)

Calls made to a provider.

#### As Type

integer

#### Minimum

0

***

### replayed

> **replayed**: `number`

Defined in: [core/src/types/eval.ts:435](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L435)

Calls answered from the cache.

#### As Type

integer

#### Minimum

0