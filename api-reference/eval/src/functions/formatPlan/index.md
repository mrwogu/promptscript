# formatPlan()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatPlan()

> **formatPlan**(`plan`, `options?`): `string`

Defined in: [eval/src/format.ts:540](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/format.ts#L540)

Format the plan of a dry run as text: per suite and model entry the cases,
cache hits and misses, calls, price source and worst-case cost, then the
totals and any setup errors. Strings are cleaned like in a report.

## Parameters

### plan

[`EvalPlan`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalPlan/index.md)

From `planEval`

### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/FormatOptions/index.md) = `{}`

`color` for the text format

## Returns

`string`

The text, ending with a newline