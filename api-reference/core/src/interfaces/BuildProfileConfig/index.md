# BuildProfileConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BuildProfileConfig

Defined in: [core/src/types/config.ts:178](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L178)

Named build profile for compiling a specific entry point to specific outputs.

## Properties

### entry?

> `optional` **entry?**: `string`

Defined in: [core/src/types/config.ts:180](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L180)

Entry file path for this build profile

***

### output?

> `optional` **output?**: `string`

Defined in: [core/src/types/config.ts:182](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L182)

Output directory for this build profile

***

### targets?

> `optional` **targets?**: [`TargetEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetEntry/index.md)[]

Defined in: [core/src/types/config.ts:184](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L184)

Target list for this build profile