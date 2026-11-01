# MockScript

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Type Alias: MockScript

> **MockScript** = `Readonly`\<`Record`\<`string`, [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>\> \| ((`request`, `context`) => [`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md) \| `Promise`\<[`MockAnswer`](https://getpromptscript.dev/api-reference/eval/src/type-aliases/MockAnswer/index.md)\>)

Defined in: [eval/src/provider.ts:65](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/provider.ts#L65)

Answers by case id, or a function of the request.