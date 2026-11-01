# EvalJudgeResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalJudgeResultV1

Defined in: [core/src/types/eval.ts:474](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L474)

Judge runs behind one llm-judge assertion result.

## Properties

### costUsd?

> `optional` **costUsd?**: `number`

Defined in: [core/src/types/eval.ts:487](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L487)

Cost of the judge runs in USD.

#### Minimum

0

***

### runs

> **runs**: `number`

Defined in: [core/src/types/eval.ts:482](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L482)

Runs made.

#### As Type

integer

#### Minimum

1

***

### verdicts

> **verdicts**: [`EvalVerdict`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalVerdict/index.md)[]

Defined in: [core/src/types/eval.ts:476](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L476)

Verdict of each run, in run order