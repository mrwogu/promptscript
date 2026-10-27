# MockAnswer

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MockAnswer

> **MockAnswer** = `string` \| `Pick`\<[`EvalResponse`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md), `"text"`\> & `Partial`\<[`EvalResponse`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md)\>

Defined in: [eval/src/provider.ts:60](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L60)

A scripted answer: the response text, or a response with defaults filled in.