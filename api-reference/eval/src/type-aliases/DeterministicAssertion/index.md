# DeterministicAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: DeterministicAssertion

> **DeterministicAssertion** = `Exclude`\<[`EvalAssertion`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalAssertion/index.md), [`EvalLlmJudgeAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLlmJudgeAssertion/index.md)\>

Defined in: [eval/src/assertions.ts:24](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/eval/src/assertions.ts#L24)

An assertion that checks a response without a model call.