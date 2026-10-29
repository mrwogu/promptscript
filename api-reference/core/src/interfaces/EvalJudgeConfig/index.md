# EvalJudgeConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalJudgeConfig

Defined in: [core/src/types/eval.ts:87](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L87)

Judge settings shared by the suite's llm-judge assertions.

## Properties

### model?

> `optional` **model?**: `string`

Defined in: [core/src/types/eval.ts:89](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L89)

Model reference the judge runs on

***

### runs?

> `optional` **runs?**: [`EvalJudgeRuns`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalJudgeRuns/index.md)

Defined in: [core/src/types/eval.ts:91](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/eval.ts#L91)

Judge runs per case; default 3