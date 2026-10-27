# EvalFinding

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalFinding

Defined in: [eval/src/errors.ts:98](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/errors.ts#L98)

A problem found while loading or checking suites and datasets.

## Properties

### code

> **code**: [`EvalCode`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalCode/index.md)

Defined in: [eval/src/errors.ts:100](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/errors.ts#L100)

Eval code

***

### file?

> `optional` **file?**: `string`

Defined in: [eval/src/errors.ts:106](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/errors.ts#L106)

File the finding is about, relative to the project root

***

### line?

> `optional` **line?**: `number`

Defined in: [eval/src/errors.ts:108](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/errors.ts#L108)

Line in the file

***

### message

> **message**: `string`

Defined in: [eval/src/errors.ts:104](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/errors.ts#L104)

What is wrong and what to do; names keys and ids, never dataset values

***

### severity

> **severity**: [`EvalFindingSeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalFindingSeverity/index.md)

Defined in: [eval/src/errors.ts:102](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/errors.ts#L102)

Errors stop a run before any call