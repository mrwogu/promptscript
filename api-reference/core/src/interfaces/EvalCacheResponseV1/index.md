# EvalCacheResponseV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCacheResponseV1

Defined in: [core/src/types/eval.ts:349](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L349)

The recorded response of a cache entry.

## Properties

### latencyMs

> **latencyMs**: `number`

Defined in: [core/src/types/eval.ts:359](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L359)

Call latency in milliseconds.

#### As Type

integer

#### Minimum

0

***

### status

> **status**: `number`

Defined in: [core/src/types/eval.ts:366](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L366)

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

Defined in: [core/src/types/eval.ts:368](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L368)

Provider stop reason, when reported

***

### text

> **text**: `string`

Defined in: [core/src/types/eval.ts:351](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L351)

Response text

***

### usage

> **usage**: [`EvalTokenUsageV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalTokenUsageV1/index.md)

Defined in: [core/src/types/eval.ts:353](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L353)

Token usage the provider reported