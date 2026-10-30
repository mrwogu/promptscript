# EvalDatasetRefV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalDatasetRefV1

Defined in: [core/src/types/eval.ts:694](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L694)

Dataset as the run saw it.

## Properties

### hash

> **hash**: `string`

Defined in: [core/src/types/eval.ts:707](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L707)

SHA-256 of the dataset file bytes.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### path

> **path**: `string`

Defined in: [core/src/types/eval.ts:696](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L696)

Dataset file, relative to the project root

***

### rows

> **rows**: `number`

Defined in: [core/src/types/eval.ts:702](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/eval.ts#L702)

Rows read.

#### As Type

integer

#### Minimum

0