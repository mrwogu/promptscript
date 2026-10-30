# EvalProgress

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: EvalProgress

> **EvalProgress** = \{ `finding`: [`EvalFinding`](https://getpromptscript.dev/api-reference/eval/src/interfaces/EvalFinding/index.md); `type`: `"warning"`; \} \| \{ `caseId`: `string`; `model`: `string`; `status`: [`EvalCaseStatus`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalCaseStatus/index.md); `suite`: `string`; `type`: `"case"`; \}

Defined in: [eval/src/run.ts:53](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/eval/src/run.ts#L53)

Something that happened during a run, for the caller to show.