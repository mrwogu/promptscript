# EvalThresholds

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalThresholds

Defined in: [core/src/types/eval.ts:211](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L211)

Limits a run must meet for the suite to pass.

## Properties

### latencyMs?

> `optional` **latencyMs?**: [`EvalLatencyThresholds`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLatencyThresholds/index.md)

Defined in: [core/src/types/eval.ts:229](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L229)

Latency limits

***

### maxCostPerCaseUsd?

> `optional` **maxCostPerCaseUsd?**: `number`

Defined in: [core/src/types/eval.ts:227](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L227)

Cost limit of one case in USD.

#### Minimum

0

***

### maxCostUsd?

> `optional` **maxCostUsd?**: `number`

Defined in: [core/src/types/eval.ts:222](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L222)

Cost limit of the whole suite run in USD.

#### Minimum

0

***

### passRate?

> `optional` **passRate?**: `number`

Defined in: [core/src/types/eval.ts:217](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L217)

Minimum share of passed cases per model entry, 0 to 1; default 1.

#### Minimum

0

#### Maximum

1