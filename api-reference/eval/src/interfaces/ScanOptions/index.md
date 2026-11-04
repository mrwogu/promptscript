# ScanOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ScanOptions

Defined in: [eval/src/dataset/scan.ts:32](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/dataset/scan.ts#L32)

Options of [scanDatasetRow](https://getpromptscript.dev/api-reference/eval/src/functions/scanDatasetRow/index.md).

## Properties

### allow?

> `optional` **allow?**: readonly [`EvalDatasetAllow`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetAllow/index.md)[]

Defined in: [eval/src/dataset/scan.ts:38](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/dataset/scan.ts#L38)

Rules whose findings the suite expects, from `dataset.allow`

***

### allowedPatterns?

> `optional` **allowedPatterns?**: readonly `string`[]

Defined in: [eval/src/dataset/scan.ts:36](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/dataset/scan.ts#L36)

`validation.allowedPatterns` of the project, the only validation setting the scan honors

***

### allowPii?

> `optional` **allowPii?**: [`EvalDatasetAllowPii`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetAllowPii/index.md)

Defined in: [eval/src/dataset/scan.ts:40](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/dataset/scan.ts#L40)

The suite's decision that the dataset may hold personal data

***

### file

> **file**: `string`

Defined in: [eval/src/dataset/scan.ts:34](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/dataset/scan.ts#L34)

Dataset path relative to the project root