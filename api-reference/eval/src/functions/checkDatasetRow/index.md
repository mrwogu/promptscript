# checkDatasetRow()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: checkDatasetRow()

> **checkDatasetRow**(`record`, `context`): [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/dataset/check.ts:73](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/dataset/check.ts#L73)

Check one dataset row against the prompt contract and the suite: no
undeclared inputs, an `expected` value that fits the output contract, and
an expected value for every `equals` assertion without its own value.
Messages name the row id and keys, never values.

## Parameters

### record

[`DatasetRecord`](https://getpromptscript.dev/api-reference/eval/src/interfaces/DatasetRecord/index.md)

Row read by `readDataset`

### context

[`DatasetCheckContext`](https://getpromptscript.dev/api-reference/eval/src/interfaces/DatasetCheckContext/index.md)

Dataset path, prompt contract and suite assertions

## Returns

[`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Error findings; empty when the row is fine