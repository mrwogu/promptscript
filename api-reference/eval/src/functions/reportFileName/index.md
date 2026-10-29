# reportFileName()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: reportFileName()

> **reportFileName**(`suite`): `string`

Defined in: [eval/src/format.ts:390](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/format.ts#L390)

File name of the report of one suite in a report directory:
`<suite>.<first 12 hex characters of the prompt content hash>.json`.

## Parameters

### suite

[`EvalSuiteResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalSuiteResultV1/index.md)

The suite result of a one-suite report

## Returns

`string`

The file name, no directory