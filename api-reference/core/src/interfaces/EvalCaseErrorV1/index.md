# EvalCaseErrorV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalCaseErrorV1

Defined in: [core/src/types/eval.ts:508](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L508)

Error that stopped one case.

## Properties

### code

> **code**: `string`

Defined in: [core/src/types/eval.ts:513](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L513)

Error code.

#### Pattern

^PS\d{3,4}$

***

### message

> **message**: `string`

Defined in: [core/src/types/eval.ts:515](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L515)

What went wrong and what to do