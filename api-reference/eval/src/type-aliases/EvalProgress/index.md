# EvalProgress

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EvalProgress

> **EvalProgress** = \{ `finding`: [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md); `type`: `"warning"`; \} \| \{ `caseId`: `string`; `model`: `string`; `status`: [`EvalCaseStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCaseStatus/index.md); `suite`: `string`; `type`: `"case"`; \}

Defined in: [eval/src/run.ts:55](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/run.ts#L55)

Something that happened during a run, for the caller to show.