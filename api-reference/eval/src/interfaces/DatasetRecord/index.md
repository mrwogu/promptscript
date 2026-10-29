# DatasetRecord

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: DatasetRecord

Defined in: [eval/src/dataset/read.ts:19](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/read.ts#L19)

One dataset row with its id filled in and the line it starts on.

## Properties

### line

> **line**: `number`

Defined in: [eval/src/dataset/read.ts:23](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/read.ts#L23)

Line of the row in the dataset file

***

### row

> **row**: [`EvalDatasetRowV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetRowV1/index.md) & `object`

Defined in: [eval/src/dataset/read.ts:21](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/read.ts#L21)

Row; `id` defaults to `row-<n>`, counted from 1 in file order

#### Type Declaration

##### id

> **id**: `string`