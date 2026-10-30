# PromptBundleInput

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleInput

Defined in: [core/src/types/prompt-bundle.ts:19](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L19)

One declared input of a prompt bundle.

## Properties

### default?

> `optional` **default?**: `string` \| `number` \| `boolean`

Defined in: [core/src/types/prompt-bundle.ts:27](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L27)

Value used when the caller passes none

***

### description

> **description**: `string`

Defined in: [core/src/types/prompt-bundle.ts:23](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L23)

Description of the input

***

### options?

> `optional` **options?**: `string`[]

Defined in: [core/src/types/prompt-bundle.ts:25](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L25)

Allowed values of an enum input

***

### required

> **required**: `boolean`

Defined in: [core/src/types/prompt-bundle.ts:32](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L32)

True when the input has no default.

#### Example

```ts
true
```

***

### type

> **type**: `"string"` \| `"number"` \| `"boolean"` \| `"enum"`

Defined in: [core/src/types/prompt-bundle.ts:21](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/prompt-bundle.ts#L21)

Value type