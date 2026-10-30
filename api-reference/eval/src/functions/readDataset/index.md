# readDataset()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: readDataset()

> **readDataset**(`file`, `options`): `AsyncIterable`\<[`DatasetRecord`](https://getpromptscript.dev/api-reference/eval/src/interfaces/DatasetRecord/index.md)\>

Defined in: [eval/src/dataset/read.ts:457](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/dataset/read.ts#L457)

Read a dataset file row by row: JSONL, CSV or YAML by the extension of the
path as written. JSONL streams, so reading stops at the row limit without
reading the rest. CSV cells are coerced by the contract's input and output
types; JSONL and YAML values are never coerced. Rows are built on null-prototype objects and
never interpolate `${VAR}`.

## Parameters

### file

`string`

Real path of the dataset, as returned by `loadSuites`

### options

[`ReadDatasetOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ReadDatasetOptions/index.md)

Project root, row limit and prompt contract

## Returns

`AsyncIterable`\<[`DatasetRecord`](https://getpromptscript.dev/api-reference/eval/src/interfaces/DatasetRecord/index.md)\>

The rows in file order

## Throws

EvalDatasetError for a parse error, a limit, a bad or duplicate id, or an empty dataset