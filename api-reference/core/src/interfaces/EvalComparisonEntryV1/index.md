# EvalComparisonEntryV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalComparisonEntryV1

Defined in: [core/src/types/eval.ts:736](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L736)

Comparison of one suite and model entry between two reports.

## Properties

### costUsdDelta?

> `optional` **costUsdDelta?**: `number`

Defined in: [core/src/types/eval.ts:744](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L744)

Candidate cost minus baseline cost in USD, when both reports carry a cost

***

### datasetChanged

> **datasetChanged**: `boolean`

Defined in: [core/src/types/eval.ts:756](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L756)

Whether the dataset hashes differ

***

### fixes

> **fixes**: `string`[]

Defined in: [core/src/types/eval.ts:750](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L750)

Cases that passed in the candidate and not in the baseline

***

### latencyP95MsDelta

> **latencyP95MsDelta**: `number`

Defined in: [core/src/types/eval.ts:746](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L746)

Candidate p95 latency minus baseline p95 latency in milliseconds

***

### model

> **model**: `string`

Defined in: [core/src/types/eval.ts:740](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L740)

Model reference

***

### onlyInBaseline

> **onlyInBaseline**: `string`[]

Defined in: [core/src/types/eval.ts:752](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L752)

Case ids only the baseline has

***

### onlyInCandidate

> **onlyInCandidate**: `string`[]

Defined in: [core/src/types/eval.ts:754](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L754)

Case ids only the candidate has

***

### passRateDelta

> **passRateDelta**: `number`

Defined in: [core/src/types/eval.ts:742](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L742)

Candidate pass rate minus baseline pass rate

***

### regressions

> **regressions**: `string`[]

Defined in: [core/src/types/eval.ts:748](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L748)

Cases that passed in the baseline and not in the candidate

***

### suite

> **suite**: `string`

Defined in: [core/src/types/eval.ts:738](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L738)

Suite name