# runEval()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: runEval()

> **runEval**(`options`): `Promise`\<[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)\>

Defined in: [eval/src/run.ts:998](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/run.ts#L998)

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