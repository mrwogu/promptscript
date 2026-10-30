# EvalDatasetRef

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalDatasetRef

Defined in: [core/src/types/eval.ts:60](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L60)

Dataset reference of a suite with review decisions.

## Properties

### allow?

> `optional` **allow?**: [`EvalDatasetAllow`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetAllow/index.md)[]

Defined in: [core/src/types/eval.ts:67](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L67)

Scan rules whose findings are expected in this dataset

***

### allowPii?

> `optional` **allowPii?**: [`EvalDatasetAllowPii`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalDatasetAllowPii/index.md)

Defined in: [core/src/types/eval.ts:69](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L69)

Personal data is expected in this dataset

***

### path

> **path**: `string`

Defined in: [core/src/types/eval.ts:65](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L65)

Dataset file, relative to the suite file.

#### Example

```ts
"datasets/refund-reply.jsonl"
```