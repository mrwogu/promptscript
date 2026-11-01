# readReport()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: readReport()

> **readReport**(`text`, `label`): [`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

Defined in: [eval/src/compare.ts:101](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/compare.ts#L101)

Parse a report file and check what a comparison reads: the schema URL,
suites with names, dataset hashes, models with a pass rate and p95
latency, and cases with an id and a status. Names, model refs and case ids
must be unique. The error names the file and the problem, never the
parser message or any content.

## Parameters

### text

`string`

File content

### label

`string`

File name shown in errors

## Returns

[`EvalReportV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalReportV1/index.md)

The report

## Throws

EvalError `PS6701`