# EvalDatasetAllowPii

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalDatasetAllowPii

Defined in: [core/src/types/eval.ts:50](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L50)

Decision that the dataset may hold personal data, with the reason.

## Properties

### reason

> **reason**: `string`

Defined in: [core/src/types/eval.ts:56](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L56)

Why personal data is expected; copied into the report.

#### Min Length

1

#### Max Length

500