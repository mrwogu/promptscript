# ProviderFactoryOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProviderFactoryOptions

Defined in: [eval/src/provider-setup.ts:23](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/provider-setup.ts#L23)

Options of [createProviderFactory](https://getpromptscript.dev/api-reference/eval/src/functions/createProviderFactory/index.md).

## Extends

- [`ProviderDeps`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderDeps/index.md)

## Properties

### allowedHosts?

> `optional` **allowedHosts?**: readonly `string`[]

Defined in: [eval/src/provider-setup.ts:29](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/provider-setup.ts#L29)

Hosts allowed besides the built-in defaults, from `--allow-host`

***

### allowLocal?

> `optional` **allowLocal?**: `boolean`

Defined in: [eval/src/provider-setup.ts:31](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/provider-setup.ts#L31)

Allow loopback hosts and plain http for them, from `--allow-local`

***

### config?

> `optional` **config?**: [`EvalConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/EvalConfig/index.md)

Defined in: [eval/src/provider-setup.ts:25](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/provider-setup.ts#L25)

The `eval` section of promptscript.yaml

***

### env

> **env**: `Readonly`\<`Record`\<`string`, `string` \| `undefined`\>\>

Defined in: [eval/src/provider-setup.ts:27](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/provider-setup.ts#L27)

Environment the key variables are read from, at call time

***

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

#### Inherited from

[`ProviderDeps`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderDeps/index.md).[`fetch`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderDeps/index.md#fetch)

***

### onUse?

> `optional` **onUse?**: (`use`) => `void`

Defined in: [eval/src/provider-setup.ts:37](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/eval/src/provider-setup.ts#L37)

Called once per provider before it is used, so the CLI can print where the
key goes. The config names the variable in `apiKeyEnvVar`, so it decides
which secret of the environment is sent: review that key like code.

#### Parameters

##### use

[`ProviderUse`](https://getpromptscript.dev/api-reference/eval/src/interfaces/ProviderUse/index.md)

#### Returns

`void`