# EvalJudgeRefV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalJudgeRefV1

Defined in: [core/src/types/eval.ts:711](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/eval.ts#L711)

A judge rubric the run used.

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/eval.ts:718](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/eval.ts#L718)

Content hash of the rubric bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### rubric

> **rubric**: `string`

Defined in: [core/src/types/eval.ts:713](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/eval.ts#L713)

Rubric prompt id