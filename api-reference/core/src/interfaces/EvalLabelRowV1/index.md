# EvalLabelRowV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalLabelRowV1

Defined in: [core/src/types/eval.ts:277](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L277)

One human label of a judged case, version 1.

## Properties

### assertion

> **assertion**: `string`

Defined in: [core/src/types/eval.ts:287](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L287)

Id of the llm-judge assertion the label is for.

#### Pattern

^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$

***

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:282](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L282)

Dataset row id the label is for.

#### Pattern

^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$

***

### note?

> `optional` **note?**: `string`

Defined in: [core/src/types/eval.ts:291](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L291)

Reviewer note

***

### verdict

> **verdict**: [`EvalVerdict`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalVerdict/index.md)

Defined in: [core/src/types/eval.ts:289](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/eval.ts#L289)

Human verdict