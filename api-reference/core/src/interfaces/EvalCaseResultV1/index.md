# EvalCaseResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCaseResultV1

Defined in: [core/src/types/eval.ts:519](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L519)

Result of one case on one model entry.

## Properties

### assertions

> **assertions**: [`EvalAssertionResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:527](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L527)

Assertion results in suite order

***

### cache

> **cache**: [`EvalCacheUseV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheUseV1/index.md)

Defined in: [core/src/types/eval.ts:542](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L542)

Cache use of the case

***

### cacheKeys

> **cacheKeys**: `string`[]

Defined in: [core/src/types/eval.ts:544](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L544)

Cache keys of every call or hit the case consumed, judge runs included, in call order

***

### costUsd?

> `optional` **costUsd?**: `number`

Defined in: [core/src/types/eval.ts:534](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L534)

Cost of the case in USD.

#### Minimum

0

***

### error?

> `optional` **error?**: [`EvalCaseErrorV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCaseErrorV1/index.md)

Defined in: [core/src/types/eval.ts:546](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L546)

Error that stopped the case

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:521](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L521)

Dataset row id

***

### latencyMs

> **latencyMs**: `number`

Defined in: [core/src/types/eval.ts:540](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L540)

Latency of the case call in milliseconds.

#### As Type

integer

#### Minimum

0

***

### status

> **status**: [`EvalCaseStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCaseStatus/index.md)

Defined in: [core/src/types/eval.ts:525](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L525)

Case status

***

### tags?

> `optional` **tags?**: `string`[]

Defined in: [core/src/types/eval.ts:523](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L523)

Row tags

***

### usage

> **usage**: [`EvalUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalUsageV1/index.md)

Defined in: [core/src/types/eval.ts:529](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L529)

Calls and tokens of the case, judge runs included