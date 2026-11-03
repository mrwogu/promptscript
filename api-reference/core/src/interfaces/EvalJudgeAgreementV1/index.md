# EvalJudgeAgreementV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalJudgeAgreementV1

Defined in: [core/src/types/eval.ts:586](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L586)

Agreement between a judge assertion and the human labels.

## Properties

### agreed

> **agreed**: `number`

Defined in: [core/src/types/eval.ts:600](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L600)

Labelled cases where the judge agreed with the label.

#### As Type

integer

#### Minimum

0

***

### assertion

> **assertion**: `string`

Defined in: [core/src/types/eval.ts:588](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L588)

Judge assertion id

***

### labelled

> **labelled**: `number`

Defined in: [core/src/types/eval.ts:594](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/eval.ts#L594)

Cases with a human label.

#### As Type

integer

#### Minimum

0