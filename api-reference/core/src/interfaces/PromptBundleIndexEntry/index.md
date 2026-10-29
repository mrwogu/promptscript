# PromptBundleIndexEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptBundleIndexEntry

Defined in: [core/src/types/prompt-bundle.ts:149](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L149)

One prompt listed in a bundle index.

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/prompt-bundle.ts:166](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L166)

Content hash of the bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### description

> **description**: `string`

Defined in: [core/src/types/prompt-bundle.ts:161](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L161)

What the prompt does

***

### file

> **file**: `string`

Defined in: [core/src/types/prompt-bundle.ts:159](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L159)

Bundle file, relative to the index.

#### Example

```ts
"refund-reply.json"
```

***

### id

> **id**: `string`

Defined in: [core/src/types/prompt-bundle.ts:154](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L154)

Prompt id.

#### Example

```ts
"acme-support/refund-reply"
```