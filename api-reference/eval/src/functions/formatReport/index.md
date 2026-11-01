# formatReport()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatReport()

> **formatReport**(`report`, `format`, `options?`): `string`

Defined in: [eval/src/format.ts:433](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/format.ts#L433)

Format a report. Every string is normalized first: line breaks fold to a
space and control and bidi characters go, in all four formats, on and off a
terminal. JSON and Markdown print one document; Markdown shows model text
only inside code spans; JUnit is XML 1.0 safe.

## Parameters

### report

[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

The report

### format

[`EvalReportFormat`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalReportFormat/index.md)

`text`, `json`, `markdown` or `junit`

### options?

[`FormatOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/FormatOptions/index.md) = `{}`

`color` for the text format, `missing` baseline entries

## Returns

`string`

The document, ending with a newline