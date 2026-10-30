# MockScript

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MockScript

> **MockScript** = `Readonly`\<`Record`\<`string`, [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>\> \| ((`request`, `context`) => [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md) \| `Promise`\<[`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>)

Defined in: [eval/src/provider.ts:65](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/provider.ts#L65)

Answers by case id, or a function of the request.