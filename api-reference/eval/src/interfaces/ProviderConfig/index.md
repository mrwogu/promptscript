# ProviderConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ProviderConfig

Defined in: [eval/src/http-provider.ts:15](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L15)

Settings of one HTTP provider.

## Properties

### allowedHosts?

> `optional` **allowedHosts?**: readonly `string`[]

Defined in: [eval/src/http-provider.ts:25](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L25)

Hosts allowed besides the built-in defaults, from `--allow-host`

***

### allowLocal?

> `optional` **allowLocal?**: `boolean`

Defined in: [eval/src/http-provider.ts:27](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L27)

Allow loopback hosts, and plain http for them, from `--allow-local`

***

### apiKey

> **apiKey**: () => `string`

Defined in: [eval/src/http-provider.ts:21](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L21)

Returns the API key; read at call time and never stored

#### Returns

`string`

***

### baseUrl

> **baseUrl**: `string`

Defined in: [eval/src/http-provider.ts:19](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L19)

API base URL

***

### name

> **name**: `string`

Defined in: [eval/src/http-provider.ts:17](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L17)

Name of the provider entry, such as `anthropic`; messages name it

***

### secrets?

> `optional` **secrets?**: () => readonly `string`[]

Defined in: [eval/src/http-provider.ts:23](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L23)

Other values to keep out of error echoes, such as every environment value

#### Returns

readonly `string`[]

***

### timeoutMs?

> `optional` **timeoutMs?**: `number`

Defined in: [eval/src/http-provider.ts:29](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/eval/src/http-provider.ts#L29)

Time limit of one call in milliseconds, response body included; default 60000