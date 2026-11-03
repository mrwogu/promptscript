# UserConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: UserConfig

Defined in: [core/src/types/config.ts:772](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L772)

User-level configuration stored at ~/.promptscript/config.yaml.
Provides defaults that can be overridden by project config, env vars, or CLI flags.

## Properties

### defaults?

> `optional` **defaults?**: `object`

Defined in: [core/src/types/config.ts:796](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L796)

#### targets?

> `optional` **targets?**: `string`[]

#### team?

> `optional` **team?**: `string`

***

### registries?

> `optional` **registries?**: [`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Defined in: [core/src/types/config.ts:795](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L795)

***

### registry?

> `optional` **registry?**: `object`

Defined in: [core/src/types/config.ts:776](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L776)

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

Defined in: [core/src/types/config.ts:775](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L775)

Enable anonymous aggregate usage telemetry by default

***

### version

> **version**: `"1"`

Defined in: [core/src/types/config.ts:773](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/config.ts#L773)