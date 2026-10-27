# MockScript

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MockScript

> **MockScript** = `Readonly`\<`Record`\<`string`, [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>\> \| ((`request`, `context`) => [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md) \| `Promise`\<[`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>)

Defined in: [eval/src/provider.ts:63](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/provider.ts#L63)

Answers by case id, or a function of the request.