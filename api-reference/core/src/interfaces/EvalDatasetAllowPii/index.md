# EvalDatasetAllowPii

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalDatasetAllowPii

Defined in: [core/src/types/eval.ts:50](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L50)

Decision that the dataset may hold personal data, with the reason.

## Properties

### reason

> **reason**: `string`

Defined in: [core/src/types/eval.ts:56](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L56)

Why personal data is expected; copied into the report.

#### Min Length

1

#### Max Length

500