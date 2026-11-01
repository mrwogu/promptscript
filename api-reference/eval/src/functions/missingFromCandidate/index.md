# missingFromCandidate()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: missingFromCandidate()

> **missingFromCandidate**(`baseline`, `candidate`): `string`[]

Defined in: [eval/src/compare.ts:255](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/compare.ts#L255)

Suites and models the baseline has and the candidate lacks: `suite` for a
whole suite, `suite/model` for a model entry of a suite both have. A
comparison never counts these as regressions, so callers show them.

## Parameters

### baseline

[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

The earlier report

### candidate

[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

The report under test

## Returns

`string`[]

Names sorted by code units