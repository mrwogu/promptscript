# BuildProfileConfig

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: BuildProfileConfig

Defined in: [core/src/types/config.ts:251](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L251)

Named build profile for compiling a specific entry point to specific outputs.

## Properties

### entry?

> `optional` **entry?**: `string`

Defined in: [core/src/types/config.ts:253](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L253)

Entry file path for this build profile

***

### output?

> `optional` **output?**: `string`

Defined in: [core/src/types/config.ts:255](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L255)

Output directory for this build profile

***

### targets?

> `optional` **targets?**: [`TargetEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/TargetEntry/index.md)[]

Defined in: [core/src/types/config.ts:257](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/types/config.ts#L257)

Target list for this build profile