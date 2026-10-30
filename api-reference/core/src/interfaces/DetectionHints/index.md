# DetectionHints

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: DetectionHints

Defined in: [core/src/types/manifest.ts:29](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L29)

Detection hints for auto-suggesting configurations.

## Properties

### always?

> `optional` **always?**: `boolean`

Defined in: [core/src/types/manifest.ts:31](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L31)

Always suggest this configuration

***

### dependencies?

> `optional` **dependencies?**: `string`[]

Defined in: [core/src/types/manifest.ts:35](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L35)

Suggest if these dependencies are present (package.json, etc.)

***

### files?

> `optional` **files?**: `string`[]

Defined in: [core/src/types/manifest.ts:33](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L33)

Suggest if these files exist in the project

***

### frameworks?

> `optional` **frameworks?**: `string`[]

Defined in: [core/src/types/manifest.ts:39](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L39)

Suggest if these frameworks are detected

***

### languages?

> `optional` **languages?**: `string`[]

Defined in: [core/src/types/manifest.ts:37](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/manifest.ts#L37)

Suggest if these languages are detected