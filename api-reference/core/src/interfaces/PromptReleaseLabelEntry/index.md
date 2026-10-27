# PromptReleaseLabelEntry

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptReleaseLabelEntry

Defined in: [core/src/types/prompt-bundle.ts:186](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L186)

One prompt a release label points at.

## Properties

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/prompt-bundle.ts:196](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L196)

Content hash of the released bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### id

> **id**: `string`

Defined in: [core/src/types/prompt-bundle.ts:191](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/prompt-bundle.ts#L191)

Prompt id.

#### Example

```ts
"acme-support/refund-reply"
```