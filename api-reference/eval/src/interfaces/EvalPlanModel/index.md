# EvalPlanModel

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalPlanModel

Defined in: [eval/src/run.ts:992](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L992)

One model entry of a suite in a [EvalPlan](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlan/index.md).

## Properties

### apiId

> **apiId**: `string`

Defined in: [eval/src/run.ts:995](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L995)

***

### calls

> **calls**: `number`

Defined in: [eval/src/run.ts:1003](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1003)

Calls a record or off run would make: misses, rows with one request counted once

***

### cases

> **cases**: `number`

Defined in: [eval/src/run.ts:997](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L997)

Cases: rows of the dataset

***

### hits

> **hits**: `number`

Defined in: [eval/src/run.ts:999](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L999)

Cases the cache answers

***

### misses

> **misses**: `number`

Defined in: [eval/src/run.ts:1001](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1001)

Cases the cache does not answer

***

### priceSource?

> `optional` **priceSource?**: [`PriceSource`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/PriceSource/index.md)

Defined in: [eval/src/run.ts:1005](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1005)

Price source, when the run is priced

***

### provider

> **provider**: `string`

Defined in: [eval/src/run.ts:994](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L994)

***

### ref

> **ref**: `string`

Defined in: [eval/src/run.ts:993](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L993)

***

### worstCaseUsd?

> `optional` **worstCaseUsd?**: `number`

Defined in: [eval/src/run.ts:1007](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1007)

Worst-case cost of its calls in USD, when the run is priced