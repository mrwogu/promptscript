# ApprovalApproverV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ApprovalApproverV1

Defined in: [core/src/types/approval.ts:9](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/approval.ts#L9)

Who approved, as the record states it.

## Properties

### source

> **source**: `"asserted"`

Defined in: [core/src/types/approval.ts:11](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/approval.ts#L11)

`asserted`: the identity is a claim, it binds through the review of the change that adds the record

***

### value

> **value**: `string`

Defined in: [core/src/types/approval.ts:18](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/core/src/types/approval.ts#L18)

Git host user handle, at most 100 characters after the `@`.

#### Pattern

^@[A-Za-z0-9]+(?:[_.-][A-Za-z0-9]+)*$

#### Max Length

101

#### Example

```ts
"@jane"
```