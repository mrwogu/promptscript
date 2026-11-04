# MockAnswer

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MockAnswer

> **MockAnswer** = `string` \| `Pick`\<[`EvalResponse`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md), `"text"`\> & `Partial`\<[`EvalResponse`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/EvalResponse/index.md)\>

Defined in: [eval/src/provider.ts:62](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/eval/src/provider.ts#L62)

A scripted answer: the response text, or a response with defaults filled in.