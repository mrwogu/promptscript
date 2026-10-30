# EvalThresholds

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalThresholds

Defined in: [core/src/types/eval.ts:207](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L207)

Limits a run must meet for the suite to pass.

## Properties

### latencyMs?

> `optional` **latencyMs?**: [`EvalLatencyThresholds`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLatencyThresholds/index.md)

Defined in: [core/src/types/eval.ts:225](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L225)

Latency limits

***

### maxCostPerCaseUsd?

> `optional` **maxCostPerCaseUsd?**: `number`

Defined in: [core/src/types/eval.ts:223](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L223)

Cost limit of one case in USD.

#### Minimum

0

***

### maxCostUsd?

> `optional` **maxCostUsd?**: `number`

Defined in: [core/src/types/eval.ts:218](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L218)

Cost limit of the whole suite run in USD.

#### Minimum

0

***

### passRate?

> `optional` **passRate?**: `number`

Defined in: [core/src/types/eval.ts:213](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L213)

Minimum share of passed cases per model entry, 0 to 1; default 1.

#### Minimum

0

#### Maximum

1