# EvalThresholdResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalThresholdResultV1

Defined in: [core/src/types/eval.ts:641](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L641)

One threshold check of a suite.

## Properties

### actual

> **actual**: `number`

Defined in: [core/src/types/eval.ts:649](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L649)

Value of the run

***

### limit

> **limit**: `number`

Defined in: [core/src/types/eval.ts:647](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L647)

Limit from the suite

***

### model?

> `optional` **model?**: `string`

Defined in: [core/src/types/eval.ts:645](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L645)

Model entry the check applies to; absent for a suite-wide limit

***

### name

> **name**: [`EvalThresholdName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalThresholdName/index.md)

Defined in: [core/src/types/eval.ts:643](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L643)

Threshold name

***

### passed

> **passed**: `boolean`

Defined in: [core/src/types/eval.ts:651](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L651)

Whether the limit held