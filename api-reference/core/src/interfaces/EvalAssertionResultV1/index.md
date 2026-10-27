# EvalAssertionResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalAssertionResultV1

Defined in: [core/src/types/eval.ts:491](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L491)

Result of one assertion on one case.

## Properties

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:493](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L493)

Assertion id

***

### judge?

> `optional` **judge?**: [`EvalJudgeResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJudgeResultV1/index.md)

Defined in: [core/src/types/eval.ts:504](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L504)

Judge runs, for llm-judge assertions

***

### kind

> **kind**: [`EvalAssertionKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalAssertionKind/index.md)

Defined in: [core/src/types/eval.ts:495](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L495)

Assertion kind

***

### passed

> **passed**: `boolean`

Defined in: [core/src/types/eval.ts:497](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L497)

Whether the assertion passed

***

### reason?

> `optional` **reason?**: `string`

Defined in: [core/src/types/eval.ts:502](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L502)

Why it failed, with at most 80 characters of the actual value.

#### Max Length

160