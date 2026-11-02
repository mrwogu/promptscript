# MockScript

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MockScript

> **MockScript** = `Readonly`\<`Record`\<`string`, [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>\> \| ((`request`, `context`) => [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md) \| `Promise`\<[`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>)

Defined in: [eval/src/provider.ts:65](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/eval/src/provider.ts#L65)

Answers by case id, or a function of the request.