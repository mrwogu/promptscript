# EvalCacheResponseV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCacheResponseV1

Defined in: [core/src/types/eval.ts:357](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L357)

The recorded response of a cache entry.

## Properties

### latencyMs

> **latencyMs**: `number`

Defined in: [core/src/types/eval.ts:367](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L367)

Call latency in milliseconds.

#### As Type

integer

#### Minimum

0

***

### status

> **status**: `number`

Defined in: [core/src/types/eval.ts:374](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L374)

HTTP status of the call.

#### As Type

integer

#### Minimum

100

#### Maximum

599

***

### stopReason?

> `optional` **stopReason?**: `string`

Defined in: [core/src/types/eval.ts:376](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L376)

Provider stop reason, when reported

***

### text

> **text**: `string`

Defined in: [core/src/types/eval.ts:359](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L359)

Response text

***

### usage

> **usage**: [`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md)

Defined in: [core/src/types/eval.ts:361](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/eval.ts#L361)

Token usage the provider reported