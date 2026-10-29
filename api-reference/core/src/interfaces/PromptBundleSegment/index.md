# PromptBundleSegment

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleSegment

Defined in: [core/src/types/prompt-bundle.ts:83](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L83)

Where one message segment came from. Informational, outside the hash.

## Properties

### files

> **files**: `string`[]

Defined in: [core/src/types/prompt-bundle.ts:92](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L92)

Distinct source files of the segment, in trace order

***

### message

> **message**: [`PromptBundleRole`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PromptBundleRole/index.md)

Defined in: [core/src/types/prompt-bundle.ts:85](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L85)

Message the segment belongs to

***

### path

> **path**: `string`

Defined in: [core/src/types/prompt-bundle.ts:90](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L90)

Block path of the segment.

#### Example

```ts
"identity"
```