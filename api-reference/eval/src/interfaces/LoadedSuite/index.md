# LoadedSuite

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: LoadedSuite

Defined in: [eval/src/suite/load.ts:10](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/suite/load.ts#L10)

A suite file read from `.promptscript/evals/`.

## Properties

### datasetFile

> **datasetFile**: `string`

Defined in: [eval/src/suite/load.ts:18](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/suite/load.ts#L18)

Real path of the dataset file, inside the project

***

### file

> **file**: `string`

Defined in: [eval/src/suite/load.ts:14](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/suite/load.ts#L14)

Suite file, relative to the project root

***

### hash

> **hash**: `string`

Defined in: [eval/src/suite/load.ts:22](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/suite/load.ts#L22)

SHA-256 of the suite file bytes, `sha256-` plus 64 hex characters

***

### labelsFile?

> `optional` **labelsFile?**: `string`

Defined in: [eval/src/suite/load.ts:20](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/suite/load.ts#L20)

Real path of the label file, when the suite names one

***

### name

> **name**: `string`

Defined in: [eval/src/suite/load.ts:12](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/suite/load.ts#L12)

Suite name: the file name without `.eval.<ext>`

***

### suite

> **suite**: [`EvalSuiteV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalSuiteV1/index.md)

Defined in: [eval/src/suite/load.ts:16](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/suite/load.ts#L16)

The validated suite