# formatPlan()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatPlan()

> **formatPlan**(`plan`, `options?`): `string`

Defined in: [eval/src/format.ts:571](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/format.ts#L571)

Format the plan of a dry run as text: per suite and model entry the cases,
cache hits and misses, calls, judge hits and calls, price source and worst-case cost, then the
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