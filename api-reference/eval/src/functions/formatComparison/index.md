# formatComparison()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatComparison()

> **formatComparison**(`comparison`, `format`, `options?`): `string`

Defined in: [eval/src/format.ts:503](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/format.ts#L503)

Format a comparison of two reports. JSON puts the schema URL first.

## Parameters

### comparison

[`EvalComparisonV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalComparisonV1/index.md)

From `compareReports`

### format

[`EvalComparisonFormat`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalComparisonFormat/index.md)

`text`, `json` or `markdown`

### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/FormatOptions/index.md) = `{}`

`color` for the text format, `missing` baseline entries

## Returns

`string`

The document, ending with a newline