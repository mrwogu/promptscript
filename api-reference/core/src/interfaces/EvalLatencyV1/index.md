# EvalLatencyV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalLatencyV1

Defined in: [core/src/types/eval.ts:550](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L550)

Latency percentiles over the recorded latencies, nearest rank.

## Properties

### p50

> **p50**: `number`

Defined in: [core/src/types/eval.ts:556](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L556)

Median latency in milliseconds.

#### As Type

integer

#### Minimum

0

***

### p95

> **p95**: `number`

Defined in: [core/src/types/eval.ts:562](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L562)

95th percentile latency in milliseconds.

#### As Type

integer

#### Minimum

0