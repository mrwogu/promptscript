# runEval()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: runEval()

> **runEval**(`options`): `Promise`\<[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)\>

Defined in: [eval/src/run.ts:984](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L984)

Run suites and return the report of the whole run.

## Parameters

### options

[`RunEvalOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/RunEvalOptions/index.md)

Suites, bundles, catalog, providers, cache, budget and limits

## Returns

`Promise`\<[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)\>

The report of the run

## See

runEvalDetailed