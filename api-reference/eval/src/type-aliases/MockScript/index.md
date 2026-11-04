# MockScript

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MockScript

> **MockScript** = `Readonly`\<`Record`\<`string`, [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>\> \| ((`request`, `context`) => [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md) \| `Promise`\<[`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>)

Defined in: [eval/src/provider.ts:65](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/provider.ts#L65)

Answers by case id, or a function of the request.