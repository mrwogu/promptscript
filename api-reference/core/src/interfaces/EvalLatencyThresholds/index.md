# EvalLatencyThresholds

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalLatencyThresholds

Defined in: [core/src/types/eval.ts:191](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L191)

Latency limits over the recorded latencies of a run.

## Properties

### p50?

> `optional` **p50?**: `number`

Defined in: [core/src/types/eval.ts:197](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L197)

Median latency limit in milliseconds.

#### As Type

integer

#### Minimum

1

***

### p95?

> `optional` **p95?**: `number`

Defined in: [core/src/types/eval.ts:203](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L203)

95th percentile latency limit in milliseconds.

#### As Type

integer

#### Minimum

1