# EvalDatasetRefV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalDatasetRefV1

Defined in: [core/src/types/eval.ts:722](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L722)

Dataset as the run saw it.

## Properties

### hash

> **hash**: `string`

Defined in: [core/src/types/eval.ts:735](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L735)

SHA-256 of the dataset file bytes.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### path

> **path**: `string`

Defined in: [core/src/types/eval.ts:724](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L724)

Dataset file, relative to the project root

***

### rows

> **rows**: `number`

Defined in: [core/src/types/eval.ts:730](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L730)

Rows read.

#### As Type

integer

#### Minimum

0