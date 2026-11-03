# EvalLatencyThresholds

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalLatencyThresholds

Defined in: [core/src/types/eval.ts:195](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L195)

Latency limits over the recorded latencies of a run.

## Properties

### p50?

> `optional` **p50?**: `number`

Defined in: [core/src/types/eval.ts:201](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L201)

Median latency limit in milliseconds.

#### As Type

integer

#### Minimum

1

***

### p95?

> `optional` **p95?**: `number`

Defined in: [core/src/types/eval.ts:207](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L207)

95th percentile latency limit in milliseconds.

#### As Type

integer

#### Minimum

1