# LockfileDependency

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: LockfileDependency

Defined in: [core/src/types/lockfile.ts:4](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/lockfile.ts#L4)

A single locked dependency.

## Properties

### commit

> **commit**: `string`

Defined in: [core/src/types/lockfile.ts:8](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/lockfile.ts#L8)

Exact commit hash

***

### fetchedAt?

> `optional` **fetchedAt?**: `string`

Defined in: [core/src/types/lockfile.ts:14](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/lockfile.ts#L14)

ISO timestamp of last fetch (informational)

***

### gitUrl?

> `optional` **gitUrl?**: `string`

Defined in: [core/src/types/lockfile.ts:18](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/lockfile.ts#L18)

Original SSH clone URL for repositories that require SSH transport

***

### integrity

> **integrity**: `string`

Defined in: [core/src/types/lockfile.ts:10](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/lockfile.ts#L10)

Content integrity hash

***

### skills?

> `optional` **skills?**: `string`[]

Defined in: [core/src/types/lockfile.ts:16](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/lockfile.ts#L16)

Discovered skill names for directory imports (advisory)

***

### source?

> `optional` **source?**: `"md"`

Defined in: [core/src/types/lockfile.ts:12](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/lockfile.ts#L12)

Source discriminator for .md-sourced dependencies

***

### version

> **version**: `string`

Defined in: [core/src/types/lockfile.ts:6](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/lockfile.ts#L6)

Resolved version (tag name or branch)