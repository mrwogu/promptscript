# reportFileName()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: reportFileName()

> **reportFileName**(`suite`): `string`

Defined in: [eval/src/format.ts:418](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/format.ts#L418)

File name of the report of one suite in a report directory:
`<suite>.<first 12 hex characters of the prompt content hash>.json`.

## Parameters

### suite

[`EvalSuiteResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalSuiteResultV1/index.md)

The suite result of a one-suite report

## Returns

`string`

The file name, no directory