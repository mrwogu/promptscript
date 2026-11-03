# DeterministicAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: DeterministicAssertion

> **DeterministicAssertion** = `Exclude`\<[`EvalAssertion`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalAssertion/index.md), [`EvalLlmJudgeAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLlmJudgeAssertion/index.md)\>

Defined in: [eval/src/assertions.ts:24](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/eval/src/assertions.ts#L24)

An assertion that checks a response without a model call.