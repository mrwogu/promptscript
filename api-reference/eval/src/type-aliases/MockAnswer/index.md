# MockAnswer

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MockAnswer

> **MockAnswer** = `string` \| `Pick`\<[`EvalResponse`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md), `"text"`\> & `Partial`\<[`EvalResponse`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md)\>

Defined in: [eval/src/provider.ts:62](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/eval/src/provider.ts#L62)

A scripted answer: the response text, or a response with defaults filled in.