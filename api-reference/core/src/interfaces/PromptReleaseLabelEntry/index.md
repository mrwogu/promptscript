# PromptReleaseLabelEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseLabelEntry

Defined in: [core/src/types/prompt-bundle.ts:186](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L186)

One prompt a release label points at.

## Extended by

- [`PromptReleaseLabelEntryV2`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptReleaseLabelEntryV2/index.md)

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/prompt-bundle.ts:196](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L196)

Content hash of the released bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### id

> **id**: `string`

Defined in: [core/src/types/prompt-bundle.ts:191](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/types/prompt-bundle.ts#L191)

Prompt id.

#### Example

```ts
"acme-support/refund-reply"
```