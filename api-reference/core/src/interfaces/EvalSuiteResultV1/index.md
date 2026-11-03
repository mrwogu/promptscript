# EvalSuiteResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalSuiteResultV1

Defined in: [core/src/types/eval.ts:739](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L739)

Result of one suite.

## Properties

### dataset

> **dataset**: [`EvalDatasetRefV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetRefV1/index.md)

Defined in: [core/src/types/eval.ts:750](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L750)

Dataset the suite ran on

***

### findings

> **findings**: [`EvalFindingV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalFindingV1/index.md)[]

Defined in: [core/src/types/eval.ts:758](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L758)

Dataset findings

***

### judges?

> `optional` **judges?**: [`EvalJudgeRefV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJudgeRefV1/index.md)[]

Defined in: [core/src/types/eval.ts:752](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L752)

Judge rubrics the suite used, sorted by rubric id

***

### models

> **models**: [`EvalModelResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalModelResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:760](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L760)

Model entries in suite order

***

### name

> **name**: `string`

Defined in: [core/src/types/eval.ts:741](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L741)

Suite name

***

### passed

> **passed**: `boolean`

Defined in: [core/src/types/eval.ts:754](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L754)

Whether every threshold held

***

### prompt

> **prompt**: [`EvalPromptRefV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalPromptRefV1/index.md)

Defined in: [core/src/types/eval.ts:748](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L748)

Prompt under test

***

### suiteHash

> **suiteHash**: `string`

Defined in: [core/src/types/eval.ts:746](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L746)

SHA-256 of the suite file bytes.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### thresholds

> **thresholds**: [`EvalThresholdResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalThresholdResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:756](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L756)

Threshold checks