# runEval()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: runEval()

> **runEval**(`options`): `Promise`\<[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)\>

Defined in: [eval/src/run.ts:926](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/run.ts#L926)

Run suites: check them, read and scan every dataset, render every row,
look up the cache and check the budget plan, all before the first call.
Any setup error ends the run there with outcome `error`. Then each case is
answered from the cache or a provider call and checked by its assertions.
A case failure never throws: it becomes a case with status `error`.

`replay` never creates a provider. `record`, `refresh` and `off` call
providers and need a budget; every call reserves its worst case first.
The engine reads no environment and prints nothing.

## Parameters

### options

[`RunEvalOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/RunEvalOptions/index.md)

Suites, bundles, catalog, providers, cache, budget and limits

## Returns

`Promise`\<[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)\>

The report of the run