# EvalSuiteResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalSuiteResultV1

Defined in: [core/src/types/eval.ts:711](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L711)

Result of one suite.

## Properties

### dataset

> **dataset**: [`EvalDatasetRefV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetRefV1/index.md)

Defined in: [core/src/types/eval.ts:722](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L722)

Dataset the suite ran on

***

### findings

> **findings**: [`EvalFindingV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalFindingV1/index.md)[]

Defined in: [core/src/types/eval.ts:730](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L730)

Dataset findings

***

### judges?

> `optional` **judges?**: [`EvalJudgeRefV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJudgeRefV1/index.md)[]

Defined in: [core/src/types/eval.ts:724](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L724)

Judge rubrics the suite used, sorted by rubric id

***

### models

> **models**: [`EvalModelResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalModelResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:732](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L732)

Model entries in suite order

***

### name

> **name**: `string`

Defined in: [core/src/types/eval.ts:713](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L713)

Suite name

***

### passed

> **passed**: `boolean`

Defined in: [core/src/types/eval.ts:726](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L726)

Whether every threshold held

***

### prompt

> **prompt**: [`EvalPromptRefV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalPromptRefV1/index.md)

Defined in: [core/src/types/eval.ts:720](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L720)

Prompt under test

***

### suiteHash

> **suiteHash**: `string`

Defined in: [core/src/types/eval.ts:718](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L718)

SHA-256 of the suite file bytes.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### thresholds

> **thresholds**: [`EvalThresholdResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalThresholdResultV1/index.md)[]

Defined in: [core/src/types/eval.ts:728](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L728)

Threshold checks