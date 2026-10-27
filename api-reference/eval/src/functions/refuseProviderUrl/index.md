# refuseProviderUrl()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: refuseProviderUrl()

> **refuseProviderUrl**(`url`, `options`): `string` \| `undefined`

Defined in: [eval/src/http-provider.ts:68](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/eval/src/http-provider.ts#L68)

Check a provider URL. The host must be a built-in default or in
`allowedHosts`, and pass the core URL rules without private addresses.
With `allowLocal`, loopback hosts pass too, over http or https.

## Parameters

### url

`string`

Provider URL

### options

`Pick`\<[`ProviderConfig`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderConfig/index.md), `"allowedHosts"` \| `"allowLocal"`\>

Allowed hosts and the loopback switch

## Returns

`string` \| `undefined`

The reason the URL is refused, or undefined when it passes