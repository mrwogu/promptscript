# EvalComparisonEntryV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalComparisonEntryV1

Defined in: [core/src/types/eval.ts:764](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L764)

Comparison of one suite and model entry between two reports.

## Properties

### costUsdDelta?

> `optional` **costUsdDelta?**: `number`

Defined in: [core/src/types/eval.ts:772](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L772)

Candidate cost minus baseline cost in USD, when both reports carry a cost

***

### datasetChanged

> **datasetChanged**: `boolean`

Defined in: [core/src/types/eval.ts:784](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L784)

Whether the dataset hashes differ

***

### fixes

> **fixes**: `string`[]

Defined in: [core/src/types/eval.ts:778](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L778)

Cases that passed in the candidate and not in the baseline

***

### latencyP95MsDelta

> **latencyP95MsDelta**: `number`

Defined in: [core/src/types/eval.ts:774](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L774)

Candidate p95 latency minus baseline p95 latency in milliseconds

***

### model

> **model**: `string`

Defined in: [core/src/types/eval.ts:768](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L768)

Model reference

***

### onlyInBaseline

> **onlyInBaseline**: `string`[]

Defined in: [core/src/types/eval.ts:780](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L780)

Case ids only the baseline has

***

### onlyInCandidate

> **onlyInCandidate**: `string`[]

Defined in: [core/src/types/eval.ts:782](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L782)

Case ids only the candidate has

***

### passRateDelta

> **passRateDelta**: `number`

Defined in: [core/src/types/eval.ts:770](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L770)

Candidate pass rate minus baseline pass rate

***

### regressions

> **regressions**: `string`[]

Defined in: [core/src/types/eval.ts:776](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L776)

Cases that passed in the baseline and not in the candidate

***

### suite

> **suite**: `string`

Defined in: [core/src/types/eval.ts:766](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L766)

Suite name