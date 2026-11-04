# formatComparison()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatComparison()

> **formatComparison**(`comparison`, `format`, `options?`): `string`

Defined in: [eval/src/format.ts:531](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/format.ts#L531)

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