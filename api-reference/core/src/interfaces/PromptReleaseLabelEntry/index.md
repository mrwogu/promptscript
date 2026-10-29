# PromptReleaseLabelEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseLabelEntry

Defined in: [core/src/types/prompt-bundle.ts:186](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L186)

One prompt a release label points at.

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/prompt-bundle.ts:196](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L196)

Content hash of the released bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### id

> **id**: `string`

Defined in: [core/src/types/prompt-bundle.ts:191](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/prompt-bundle.ts#L191)

Prompt id.

#### Example

```ts
"acme-support/refund-reply"
```