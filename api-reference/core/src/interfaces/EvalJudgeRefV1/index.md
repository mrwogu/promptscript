# EvalJudgeRefV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalJudgeRefV1

Defined in: [core/src/types/eval.ts:683](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L683)

A judge rubric the run used.

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/eval.ts:690](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L690)

Content hash of the rubric bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### rubric

> **rubric**: `string`

Defined in: [core/src/types/eval.ts:685](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L685)

Rubric prompt id