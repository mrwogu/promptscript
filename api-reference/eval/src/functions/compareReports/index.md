# compareReports()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: compareReports()

> **compareReports**(`baseline`, `candidate`, `options`): [`EvalComparisonV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalComparisonV1/index.md)

Defined in: [eval/src/compare.ts:231](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/compare.ts#L231)

Compare a candidate report with a baseline. Suites match by name, models
by `ref`, cases by id. A case regressed when it passed in the baseline and
does not pass in the candidate; only ids both reports have are compared.
A suite or model one report lacks gets an entry that lists its cases under
`onlyInBaseline` or `onlyInCandidate`, and never counts as a regression.
`regression` is true when a case regressed or a pass rate dropped by more
than the tolerance.

## Parameters

### baseline

[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

The earlier report

### candidate

[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

The report under test

### options

[`CompareOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/CompareOptions/index.md)

Tolerance

## Returns

[`EvalComparisonV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalComparisonV1/index.md)

The comparison, entries sorted by suite name, then model order