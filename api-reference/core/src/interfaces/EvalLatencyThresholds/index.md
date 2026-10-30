# EvalLatencyThresholds

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalLatencyThresholds

Defined in: [core/src/types/eval.ts:191](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L191)

Latency limits over the recorded latencies of a run.

## Properties

### p50?

> `optional` **p50?**: `number`

Defined in: [core/src/types/eval.ts:197](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L197)

Median latency limit in milliseconds.

#### As Type

integer

#### Minimum

1

***

### p95?

> `optional` **p95?**: `number`

Defined in: [core/src/types/eval.ts:203](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L203)

95th percentile latency limit in milliseconds.

#### As Type

integer

#### Minimum

1