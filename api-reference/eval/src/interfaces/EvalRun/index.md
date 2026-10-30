# EvalRun

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalRun

Defined in: [eval/src/run.ts:920](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L920)

What [runEvalDetailed](https://getpromptscript.dev/api-reference/eval/src/functions/runEvalDetailed/index.md) gives back.

## Properties

### report

> **report**: [`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

Defined in: [eval/src/run.ts:922](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L922)

The report of the whole run

***

### suiteReports

> **suiteReports**: [`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)[]

Defined in: [eval/src/run.ts:928](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L928)

One report per suite, built from that suite's cases alone, in suite name
order: its own outcome, usage, cache summary and digest, no budget and no
errors. Empty when setup failed.