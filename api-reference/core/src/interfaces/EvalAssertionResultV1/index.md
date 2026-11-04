# EvalAssertionResultV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalAssertionResultV1

Defined in: [core/src/types/eval.ts:511](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L511)

Result of one assertion on one case.

## Properties

### id

> **id**: `string`

Defined in: [core/src/types/eval.ts:513](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L513)

Assertion id

***

### judge?

> `optional` **judge?**: [`EvalJudgeResultV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalJudgeResultV1/index.md)

Defined in: [core/src/types/eval.ts:524](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L524)

Judge runs, for llm-judge assertions

***

### kind

> **kind**: [`EvalAssertionKind`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalAssertionKind/index.md)

Defined in: [core/src/types/eval.ts:515](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L515)

Assertion kind

***

### passed

> **passed**: `boolean`

Defined in: [core/src/types/eval.ts:517](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L517)

Whether the assertion passed

***

### reason?

> `optional` **reason?**: `string`

Defined in: [core/src/types/eval.ts:522](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/eval.ts#L522)

Why it failed, with at most 80 characters of the actual value.

#### Max Length

160