# EvalJudgeResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalJudgeResultV1

Defined in: [core/src/types/eval.ts:494](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L494)

Judge runs behind one llm-judge assertion result.

## Properties

### costUsd?

> `optional` **costUsd?**: `number`

Defined in: [core/src/types/eval.ts:507](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L507)

Cost of the judge runs in USD.

#### Minimum

0

***

### runs

> **runs**: `number`

Defined in: [core/src/types/eval.ts:502](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L502)

Runs made.

#### As Type

integer

#### Minimum

1

***

### verdicts

> **verdicts**: [`EvalVerdict`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalVerdict/index.md)[]

Defined in: [core/src/types/eval.ts:496](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L496)

Verdict of each run, in run order