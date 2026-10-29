# planEval()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: planEval()

> **planEval**(`options`): `Promise`\<[`EvalPlan`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlan/index.md)\>

Defined in: [eval/src/run.ts:1082](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L1082)

Plan a run without calling anything: the same checks as [runEval](https://getpromptscript.dev/api-reference/eval/src/functions/runEval/index.md),
the cache lookups, and the worst-case cost of every miss. It creates no
provider, so it needs no key and announces no host. It needs no budget: without
one the worst case is still estimated, from the prices, and checked against nothing.

## Parameters

### options

[`RunEvalOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/RunEvalOptions/index.md)

The options a run would get

## Returns

`Promise`\<[`EvalPlan`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlan/index.md)\>

Hits, misses, calls and worst-case cost per suite and model entry