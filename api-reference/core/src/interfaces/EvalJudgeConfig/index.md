# EvalJudgeConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: EvalJudgeConfig

Defined in: [core/src/types/eval.ts:87](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L87)

Judge settings shared by the suite's llm-judge assertions.

## Properties

### model?

> `optional` **model?**: `string`

Defined in: [core/src/types/eval.ts:89](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L89)

Model reference the judge runs on

***

### runs?

> `optional` **runs?**: [`EvalJudgeRuns`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalJudgeRuns/index.md)

Defined in: [core/src/types/eval.ts:91](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/eval.ts#L91)

Judge runs per case; default 3