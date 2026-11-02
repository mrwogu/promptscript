# DeterministicAssertion

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: DeterministicAssertion

> **DeterministicAssertion** = `Exclude`\<[`EvalAssertion`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalAssertion/index.md), [`EvalLlmJudgeAssertion`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalLlmJudgeAssertion/index.md)\>

Defined in: [eval/src/assertions.ts:24](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/eval/src/assertions.ts#L24)

An assertion that checks a response without a model call.