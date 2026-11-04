# EvalModelResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalModelResultV1

Defined in: [core/src/types/eval.ts:604](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L604)

Result of one model entry of a suite.

## Properties

### apiId

> **apiId**: `string`

Defined in: [core/src/types/eval.ts:610](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L610)

Provider API model identifier

***

### cases

> **cases**: [`EvalCaseResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCaseResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:629](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L629)

Case results sorted by id

***

### costUsd?

> `optional` **costUsd?**: `number`

Defined in: [core/src/types/eval.ts:623](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L623)

Cost of the entry in USD.

#### Minimum

0

***

### judgeAgreement?

> `optional` **judgeAgreement?**: [`EvalJudgeAgreementV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJudgeAgreementV1/index.md)[]

Defined in: [core/src/types/eval.ts:627](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L627)

Agreement with human labels per judge assertion, in assertion order

***

### latencyMs

> **latencyMs**: [`EvalLatencyV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLatencyV1/index.md)

Defined in: [core/src/types/eval.ts:625](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L625)

Latency percentiles of the entry

***

### passRate

> **passRate**: `number`

Defined in: [core/src/types/eval.ts:616](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L616)

Passed cases over all cases.

#### Minimum

0

#### Maximum

1

***

### provider

> **provider**: `string`

Defined in: [core/src/types/eval.ts:608](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L608)

Provider name

***

### ref

> **ref**: `string`

Defined in: [core/src/types/eval.ts:606](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L606)

Model reference as written

***

### usage

> **usage**: [`EvalUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalUsageV1/index.md)

Defined in: [core/src/types/eval.ts:618](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L618)

Calls and tokens of the entry