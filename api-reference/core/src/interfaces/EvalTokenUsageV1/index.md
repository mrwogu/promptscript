# EvalTokenUsageV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalTokenUsageV1

Defined in: [core/src/types/eval.ts:333](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L333)

Token counts of one or more model calls.

## Extended by

- [`EvalUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalUsageV1/index.md)

## Properties

### inputTokens

> **inputTokens**: `number`

Defined in: [core/src/types/eval.ts:339](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L339)

Input tokens.

#### As Type

integer

#### Minimum

0

***

### outputTokens

> **outputTokens**: `number`

Defined in: [core/src/types/eval.ts:345](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/eval.ts#L345)

Output tokens.

#### As Type

integer

#### Minimum

0