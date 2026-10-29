# EvalDatasetRefV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalDatasetRefV1

Defined in: [core/src/types/eval.ts:694](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L694)

Dataset as the run saw it.

## Properties

### hash

> **hash**: `string`

Defined in: [core/src/types/eval.ts:707](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L707)

SHA-256 of the dataset file bytes.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### path

> **path**: `string`

Defined in: [core/src/types/eval.ts:696](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L696)

Dataset file, relative to the project root

***

### rows

> **rows**: `number`

Defined in: [core/src/types/eval.ts:702](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L702)

Rows read.

#### As Type

integer

#### Minimum

0