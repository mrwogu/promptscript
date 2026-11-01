# EvalFinding

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalFinding

Defined in: [eval/src/errors.ts:139](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/errors.ts#L139)

A problem found while loading or checking suites and datasets.

## Properties

### code

> **code**: [`EvalCode`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalCode/index.md)

Defined in: [eval/src/errors.ts:141](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/errors.ts#L141)

Eval code

***

### file?

> `optional` **file?**: `string`

Defined in: [eval/src/errors.ts:147](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/errors.ts#L147)

File the finding is about, relative to the project root

***

### line?

> `optional` **line?**: `number`

Defined in: [eval/src/errors.ts:149](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/errors.ts#L149)

Line in the file

***

### message

> **message**: `string`

Defined in: [eval/src/errors.ts:145](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/errors.ts#L145)

What is wrong and what to do; names keys and ids, never dataset values

***

### severity

> **severity**: [`EvalFindingSeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalFindingSeverity/index.md)

Defined in: [eval/src/errors.ts:143](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/errors.ts#L143)

Errors stop a run before any call