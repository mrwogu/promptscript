# EvalPlanModel

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalPlanModel

Defined in: [eval/src/run.ts:1006](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1006)

One model entry of a suite in a [EvalPlan](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlan/index.md).

## Properties

### apiId

> **apiId**: `string`

Defined in: [eval/src/run.ts:1009](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1009)

***

### calls

> **calls**: `number`

Defined in: [eval/src/run.ts:1017](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1017)

Calls a record or off run would make: misses, rows with one request counted once

***

### cases

> **cases**: `number`

Defined in: [eval/src/run.ts:1011](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1011)

Cases: rows of the dataset

***

### hits

> **hits**: `number`

Defined in: [eval/src/run.ts:1013](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1013)

Cases the cache answers

***

### judgeCalls?

> `optional` **judgeCalls?**: `number`

Defined in: [eval/src/run.ts:1024](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1024)

Judge calls a record or off run would make, 0 in replay. A case with no
cached answer counts its judge runs at their estimate.

***

### judgeHits?

> `optional` **judgeHits?**: `number`

Defined in: [eval/src/run.ts:1019](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1019)

Judge calls the cache answers; only for a suite with judge assertions

***

### misses

> **misses**: `number`

Defined in: [eval/src/run.ts:1015](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1015)

Cases the cache does not answer

***

### priceSource?

> `optional` **priceSource?**: [`PriceSource`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/PriceSource/index.md)

Defined in: [eval/src/run.ts:1026](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1026)

Price source, when the run is priced

***

### provider

> **provider**: `string`

Defined in: [eval/src/run.ts:1008](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1008)

***

### ref

> **ref**: `string`

Defined in: [eval/src/run.ts:1007](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1007)

***

### worstCaseUsd?

> `optional` **worstCaseUsd?**: `number`

Defined in: [eval/src/run.ts:1028](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L1028)

Worst-case cost of its calls in USD, when the run is priced