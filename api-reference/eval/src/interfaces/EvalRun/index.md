# EvalRun

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalRun

Defined in: [eval/src/run.ts:928](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L928)

What [runEvalDetailed](https://getpromptscript.dev/api-reference/eval/src/functions/runEvalDetailed/index.md) gives back.

## Properties

### report

> **report**: [`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

Defined in: [eval/src/run.ts:930](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L930)

The report of the whole run

***

### suiteReports

> **suiteReports**: [`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)[]

Defined in: [eval/src/run.ts:936](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/run.ts#L936)

One report per suite, built from that suite's cases alone, in suite name
order: its own outcome, usage, cache summary and digest, no budget and no
errors. Empty when setup failed.