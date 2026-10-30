# ProviderDeps

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProviderDeps

Defined in: [eval/src/http-provider.ts:33](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/http-provider.ts#L33)

What a provider needs from its host.

## Extended by

- [`ProviderFactoryOptions`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderFactoryOptions/index.md)

## Properties

### fetch?

> `optional` **fetch?**: (`input`, `init?`) => `Promise`\<`Response`\>

Defined in: [eval/src/http-provider.ts:35](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/http-provider.ts#L35)

Fetch to use instead of the global one

#### Parameters

##### input

`string` \| `URL` \| `Request`

##### init?

`RequestInit`

#### Returns

`Promise`\<`Response`\>