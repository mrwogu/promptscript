# EvalLabelRowV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalLabelRowV1

Defined in: [core/src/types/eval.ts:269](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L269)

One human label of a judged case, version 1.

## Properties

### assertion

> **assertion**: `string`

Defined in: [core/src/types/eval.ts:279](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L279)

Id of the llm-judge assertion the label is for.

#### Pattern

^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:274](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L274)

Dataset row id the label is for.

#### Pattern

^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$

***

### note?

> `optional` **note?**: `string`

Defined in: [core/src/types/eval.ts:283](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L283)

Reviewer note

***

### verdict

> **verdict**: [`EvalVerdict`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalVerdict/index.md)

Defined in: [core/src/types/eval.ts:281](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/eval.ts#L281)

Human verdict