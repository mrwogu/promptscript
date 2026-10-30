# ReadLabels

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ReadLabels

Defined in: [eval/src/labels.ts:22](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/labels.ts#L22)

The labels of a file, and the problems that do not stop reading.

## Properties

### findings

> **findings**: [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md)[]

Defined in: [eval/src/labels.ts:26](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/labels.ts#L26)

Labels for assertions that are not llm-judge assertions of the suite

***

### labels

> **labels**: `ReadonlyMap`\<`string`, `ReadonlyMap`\<`string`, [`EvalVerdict`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalVerdict/index.md)\>\>

Defined in: [eval/src/labels.ts:24](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/labels.ts#L24)

Row id, then assertion id, then the verdict of the human