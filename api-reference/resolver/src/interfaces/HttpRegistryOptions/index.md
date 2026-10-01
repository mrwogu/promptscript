# HttpRegistryOptions

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: HttpRegistryOptions

Defined in: [resolver/src/registry.ts:94](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/registry.ts#L94)

Options for HttpRegistry.

## Properties

### auth?

> `optional` **auth?**: `object`

Defined in: [resolver/src/registry.ts:98](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/registry.ts#L98)

Authentication options

#### token

> **token**: `string`

Token for bearer auth, or "username:password" for basic

#### type

> **type**: `"bearer"` \| `"basic"`

Auth type: 'bearer' or 'basic'

***

### baseUrl

> **baseUrl**: `string`

Defined in: [resolver/src/registry.ts:96](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/registry.ts#L96)

Base URL of the registry

***

### cache?

> `optional` **cache?**: `object`

Defined in: [resolver/src/registry.ts:105](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/registry.ts#L105)

Cache settings

#### enabled

> **enabled**: `boolean`

Whether caching is enabled

#### ttl

> **ttl**: `number`

TTL in milliseconds

***

### retry?

> `optional` **retry?**: `object`

Defined in: [resolver/src/registry.ts:112](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/registry.ts#L112)

Retry settings

#### initialDelay

> **initialDelay**: `number`

Initial delay in ms (doubles each retry)

#### maxRetries

> **maxRetries**: `number`

Maximum number of retries

***

### timeout?

> `optional` **timeout?**: `number`

Defined in: [resolver/src/registry.ts:119](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/resolver/src/registry.ts#L119)

Request timeout in ms