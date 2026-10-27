# ApprovalApproverV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ApprovalApproverV1

Defined in: [core/src/types/approval.ts:9](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/approval.ts#L9)

Who approved, as the record states it.

## Properties

### source

> **source**: `"asserted"`

Defined in: [core/src/types/approval.ts:11](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/approval.ts#L11)

`asserted`: the identity is a claim, it binds through the review of the change that adds the record

***

### value

> **value**: `string`

Defined in: [core/src/types/approval.ts:17](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/approval.ts#L17)

Git host user handle.

#### Pattern

^@[A-Za-z0-9][A-Za-z0-9-]{0,38}$

#### Example

```ts
"@jane"
```