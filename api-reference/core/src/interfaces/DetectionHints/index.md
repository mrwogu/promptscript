# DetectionHints

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: DetectionHints

Defined in: [core/src/types/manifest.ts:35](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L35)

Detection hints for auto-suggesting configurations.

## Properties

### always?

> `optional` **always?**: `boolean`

Defined in: [core/src/types/manifest.ts:37](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L37)

Always suggest this configuration

***

### dependencies?

> `optional` **dependencies?**: `string`[]

Defined in: [core/src/types/manifest.ts:41](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L41)

Suggest if these dependencies are present (package.json, etc.)

***

### files?

> `optional` **files?**: `string`[]

Defined in: [core/src/types/manifest.ts:39](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L39)

Suggest if these files exist in the project

***

### frameworks?

> `optional` **frameworks?**: `string`[]

Defined in: [core/src/types/manifest.ts:45](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L45)

Suggest if these frameworks are detected

***

### languages?

> `optional` **languages?**: `string`[]

Defined in: [core/src/types/manifest.ts:43](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/types/manifest.ts#L43)

Suggest if these languages are detected