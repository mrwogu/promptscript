# EvalModelResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalModelResultV1

Defined in: [core/src/types/eval.ts:584](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L584)

Result of one model entry of a suite.

## Properties

### apiId

> **apiId**: `string`

Defined in: [core/src/types/eval.ts:590](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L590)

Provider API model identifier

***

### cases

> **cases**: [`EvalCaseResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalCaseResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:609](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L609)

Case results sorted by id

***

### costUsd?

> `optional` **costUsd?**: `number`

Defined in: [core/src/types/eval.ts:603](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L603)

Cost of the entry in USD.

#### Minimum

0

***

### judgeAgreement?

> `optional` **judgeAgreement?**: [`EvalJudgeAgreementV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJudgeAgreementV1/index.md)[]

Defined in: [core/src/types/eval.ts:607](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L607)

Agreement with human labels per judge assertion, in assertion order

***

### latencyMs

> **latencyMs**: [`EvalLatencyV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLatencyV1/index.md)

Defined in: [core/src/types/eval.ts:605](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L605)

Latency percentiles of the entry

***

### passRate

> **passRate**: `number`

Defined in: [core/src/types/eval.ts:596](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L596)

Passed cases over all cases.

#### Minimum

0

#### Maximum

1

***

### provider

> **provider**: `string`

Defined in: [core/src/types/eval.ts:588](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L588)

Provider name

***

### ref

> **ref**: `string`

Defined in: [core/src/types/eval.ts:586](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L586)

Model reference as written

***

### usage

> **usage**: [`EvalUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalUsageV1/index.md)

Defined in: [core/src/types/eval.ts:598](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L598)

Calls and tokens of the entry