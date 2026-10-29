# ReadDatasetOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReadDatasetOptions

Defined in: [eval/src/dataset/read.ts:27](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/read.ts#L27)

Options of [readDataset](https://getpromptscript.dev/api-reference/eval/src/functions/readDataset/index.md).

## Properties

### contract?

> `optional` **contract?**: `Pick`\<[`PromptBundleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleV1/index.md), `"inputs"` \| `"output"`\>

Defined in: [eval/src/dataset/read.ts:33](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/read.ts#L33)

Prompt contract, used to coerce CSV cells by input and output type

***

### maxRows?

> `optional` **maxRows?**: `number`

Defined in: [eval/src/dataset/read.ts:31](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/read.ts#L31)

Largest number of rows; default 1000

***

### projectRoot

> **projectRoot**: `string`

Defined in: [eval/src/dataset/read.ts:29](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/read.ts#L29)

Project root; error locations are relative to it

***

### writtenPath?

> `optional` **writtenPath?**: `string`

Defined in: [eval/src/dataset/read.ts:39](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/read.ts#L39)

Dataset path as written in the suite. Its extension picks the format, so
a link named `rows.csv` reads as CSV whatever its target is called.
Default: `file`.