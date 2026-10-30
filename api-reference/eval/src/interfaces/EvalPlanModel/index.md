# EvalPlanModel

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalPlanModel

Defined in: [eval/src/run.ts:998](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L998)

One model entry of a suite in a [EvalPlan](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlan/index.md).

## Properties

### apiId

> **apiId**: `string`

Defined in: [eval/src/run.ts:1001](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1001)

***

### calls

> **calls**: `number`

Defined in: [eval/src/run.ts:1009](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1009)

Calls a record or off run would make: misses, rows with one request counted once

***

### cases

> **cases**: `number`

Defined in: [eval/src/run.ts:1003](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1003)

Cases: rows of the dataset

***

### hits

> **hits**: `number`

Defined in: [eval/src/run.ts:1005](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1005)

Cases the cache answers

***

### judgeCalls?

> `optional` **judgeCalls?**: `number`

Defined in: [eval/src/run.ts:1016](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1016)

Judge calls a record or off run would make, 0 in replay. A case with no
cached answer counts its judge runs at their estimate.

***

### judgeHits?

> `optional` **judgeHits?**: `number`

Defined in: [eval/src/run.ts:1011](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1011)

Judge calls the cache answers; only for a suite with judge assertions

***

### misses

> **misses**: `number`

Defined in: [eval/src/run.ts:1007](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1007)

Cases the cache does not answer

***

### priceSource?

> `optional` **priceSource?**: [`PriceSource`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/PriceSource/index.md)

Defined in: [eval/src/run.ts:1018](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1018)

Price source, when the run is priced

***

### provider

> **provider**: `string`

Defined in: [eval/src/run.ts:1000](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1000)

***

### ref

> **ref**: `string`

Defined in: [eval/src/run.ts:999](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L999)

***

### worstCaseUsd?

> `optional` **worstCaseUsd?**: `number`

Defined in: [eval/src/run.ts:1020](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/run.ts#L1020)

Worst-case cost of its calls in USD, when the run is priced