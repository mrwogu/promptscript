# UserConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: UserConfig

Defined in: [core/src/types/config.ts:677](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L677)

User-level configuration stored at ~/.promptscript/config.yaml.
Provides defaults that can be overridden by project config, env vars, or CLI flags.

## Properties

### defaults?

> `optional` **defaults?**: `object`

Defined in: [core/src/types/config.ts:701](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L701)

#### targets?

> `optional` **targets?**: `string`[]

#### team?

> `optional` **team?**: `string`

***

### registries?

> `optional` **registries?**: [`RegistriesConfig`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RegistriesConfig/index.md)

Defined in: [core/src/types/config.ts:700](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L700)

***

### registry?

> `optional` **registry?**: `object`

Defined in: [core/src/types/config.ts:681](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L681)

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

Defined in: [core/src/types/config.ts:680](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L680)

Enable anonymous aggregate usage telemetry by default

***

### version

> **version**: `"1"`

Defined in: [core/src/types/config.ts:678](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L678)