# ProviderDeps

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProviderDeps

Defined in: [eval/src/http-provider.ts:33](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/eval/src/http-provider.ts#L33)

What a provider needs from its host.

## Extended by

- [`ProviderFactoryOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderFactoryOptions/index.md)

## Properties

### fetch?

> `optional` **fetch?**: (`input`, `init?`) => `Promise`\<`Response`\>

Defined in: [eval/src/http-provider.ts:35](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/eval/src/http-provider.ts#L35)

Fetch to use instead of the global one

#### Parameters

##### input

`string` \| `URL` \| `Request`

##### init?

`RequestInit`

#### Returns

`Promise`\<`Response`\>