# EvalFinding

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalFinding

Defined in: [eval/src/errors.ts:105](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L105)

A problem found while loading or checking suites and datasets.

## Properties

### code

> **code**: [`EvalCode`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalCode/index.md)

Defined in: [eval/src/errors.ts:107](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L107)

Eval code

***

### file?

> `optional` **file?**: `string`

Defined in: [eval/src/errors.ts:113](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L113)

File the finding is about, relative to the project root

***

### line?

> `optional` **line?**: `number`

Defined in: [eval/src/errors.ts:115](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L115)

Line in the file

***

### message

> **message**: `string`

Defined in: [eval/src/errors.ts:111](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L111)

What is wrong and what to do; names keys and ids, never dataset values

***

### severity

> **severity**: [`EvalFindingSeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalFindingSeverity/index.md)

Defined in: [eval/src/errors.ts:109](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/errors.ts#L109)

Errors stop a run before any call