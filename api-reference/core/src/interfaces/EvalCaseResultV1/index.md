# EvalCaseResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCaseResultV1

Defined in: [core/src/types/eval.ts:539](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L539)

Result of one case on one model entry.

## Properties

### assertions

> **assertions**: [`EvalAssertionResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalAssertionResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:547](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L547)

Assertion results in suite order

***

### cache

> **cache**: [`EvalCacheUseV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCacheUseV1/index.md)

Defined in: [core/src/types/eval.ts:562](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L562)

Cache use of the case

***

### cacheKeys

> **cacheKeys**: `string`[]

Defined in: [core/src/types/eval.ts:564](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L564)

Cache keys of every call or hit the case consumed, judge runs included, in call order

***

### costUsd?

> `optional` **costUsd?**: `number`

Defined in: [core/src/types/eval.ts:554](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L554)

Cost of the case in USD.

#### Minimum

0

***

### error?

> `optional` **error?**: [`EvalCaseErrorV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCaseErrorV1/index.md)

Defined in: [core/src/types/eval.ts:566](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L566)

Error that stopped the case

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:541](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L541)

Dataset row id

***

### latencyMs

> **latencyMs**: `number`

Defined in: [core/src/types/eval.ts:560](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L560)

Latency of the case call in milliseconds.

#### As Type

integer

#### Minimum

0

***

### status

> **status**: [`EvalCaseStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCaseStatus/index.md)

Defined in: [core/src/types/eval.ts:545](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L545)

Case status

***

### tags?

> `optional` **tags?**: `string`[]

Defined in: [core/src/types/eval.ts:543](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L543)

Row tags

***

### usage

> **usage**: [`EvalUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalUsageV1/index.md)

Defined in: [core/src/types/eval.ts:549](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L549)

Calls and tokens of the case, judge runs included