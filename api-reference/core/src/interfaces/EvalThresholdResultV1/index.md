# EvalThresholdResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalThresholdResultV1

Defined in: [core/src/types/eval.ts:617](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L617)

One threshold check of a suite.

## Properties

### actual

> **actual**: `number`

Defined in: [core/src/types/eval.ts:625](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L625)

Value of the run

***

### limit

> **limit**: `number`

Defined in: [core/src/types/eval.ts:623](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L623)

Limit from the suite

***

### model?

> `optional` **model?**: `string`

Defined in: [core/src/types/eval.ts:621](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L621)

Model entry the check applies to; absent for a suite-wide limit

***

### name

> **name**: [`EvalThresholdName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalThresholdName/index.md)

Defined in: [core/src/types/eval.ts:619](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L619)

Threshold name

***

### passed

> **passed**: `boolean`

Defined in: [core/src/types/eval.ts:627](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L627)

Whether the limit held