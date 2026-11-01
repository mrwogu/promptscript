# EvalJudgeAgreementV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalJudgeAgreementV1

Defined in: [core/src/types/eval.ts:566](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L566)

Agreement between a judge assertion and the human labels.

## Properties

### agreed

> **agreed**: `number`

Defined in: [core/src/types/eval.ts:580](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L580)

Labelled cases where the judge agreed with the label.

#### As Type

integer

#### Minimum

0

***

### assertion

> **assertion**: `string`

Defined in: [core/src/types/eval.ts:568](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L568)

Judge assertion id

***

### labelled

> **labelled**: `number`

Defined in: [core/src/types/eval.ts:574](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/eval.ts#L574)

Cases with a human label.

#### As Type

integer

#### Minimum

0