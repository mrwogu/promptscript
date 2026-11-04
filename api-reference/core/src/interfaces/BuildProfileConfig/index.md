# BuildProfileConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BuildProfileConfig

Defined in: [core/src/types/config.ts:251](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L251)

Named build profile for compiling a specific entry point to specific outputs.

## Properties

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: [core/src/types/config.ts:263](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L263)

Set to `false` to drop the profile, for example one inherited through
`extends`. A dropped profile is removed when the config is loaded.

#### Default

```ts
true
```

***

### entry?

> `optional` **entry?**: `string`

Defined in: [core/src/types/config.ts:253](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L253)

Entry file path for this build profile

***

### output?

> `optional` **output?**: `string`

Defined in: [core/src/types/config.ts:255](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L255)

Output directory for this build profile

***

### targets?

> `optional` **targets?**: [`TargetEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetEntry/index.md)[]

Defined in: [core/src/types/config.ts:257](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L257)

Target list for this build profile