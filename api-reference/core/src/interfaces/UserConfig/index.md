# UserConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: UserConfig

Defined in: [core/src/types/config.ts:496](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L496)

User-level configuration stored at ~/.promptscript/config.yaml.
Provides defaults that can be overridden by project config, env vars, or CLI flags.

## Properties

### defaults?

> `optional` **defaults?**: `object`

Defined in: [core/src/types/config.ts:520](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L520)

#### targets?

> `optional` **targets?**: `string`[]

#### team?

> `optional` **team?**: `string`

***

### registries?

> `optional` **registries?**: [`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Defined in: [core/src/types/config.ts:519](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L519)

***

### registry?

> `optional` **registry?**: `object`

Defined in: [core/src/types/config.ts:500](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L500)

#### cache?

> `optional` **cache?**: `object`

##### cache.enabled?

> `optional` **enabled?**: `boolean`

##### cache.ttl?

> `optional` **ttl?**: `number`

#### git?

> `optional` **git?**: `object`

##### git.auth?

> `optional` **auth?**: `object`

##### git.auth.sshKeyPath?

> `optional` **sshKeyPath?**: `string`

##### git.auth.tokenEnvVar?

> `optional` **tokenEnvVar?**: `string`

##### git.auth.type

> **type**: `"token"` \| `"ssh"`

##### git.fallbackUrl?

> `optional` **fallbackUrl?**: `string`

##### git.path?

> `optional` **path?**: `string`

##### git.ref?

> `optional` **ref?**: `string`

##### git.timeout?

> `optional` **timeout?**: `number`

##### git.url

> **url**: `string`

#### url?

> `optional` **url?**: `string`

***

### telemetry?

> `optional` **telemetry?**: `boolean`

Defined in: [core/src/types/config.ts:499](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L499)

Enable anonymous aggregate usage telemetry by default

***

### version

> **version**: `"1"`

Defined in: [core/src/types/config.ts:497](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L497)