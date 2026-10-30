# ApprovalRecordV1

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ApprovalRecordV1

Defined in: [core/src/types/approval.ts:25](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L25)

Approval of one exact prompt version by one approver in one role, version 1.
Unsigned: the record is a claim until the change adding it is reviewed.

## Properties

### $schema

> **$schema**: `"https://getpromptscript.dev/schema/approval-record/v1.json"`

Defined in: [core/src/types/approval.ts:30](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L30)

Schema URL, the version tag of the record.

#### Example

```ts
"https://getpromptscript.dev/schema/approval-record/v1.json"
```

***

### approver

> **approver**: [`ApprovalApproverV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/ApprovalApproverV1/index.md)

Defined in: [core/src/types/approval.ts:45](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L45)

Who approved

***

### comment?

> `optional` **comment?**: `string`

Defined in: [core/src/types/approval.ts:60](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L60)

Note of the approver, without control characters except newline and
without lone surrogates.

#### Max Length

2000

#### Pattern

^(?:[^\p{Cc}\p{Cs}]|\n){0,2000}$

***

### contentHash

> **contentHash**: `string`

Defined in: [core/src/types/approval.ts:41](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L41)

Content hash of the approved bundle.

#### Pattern

^sha256-[0-9a-f]{64}$

***

### createdAt

> **createdAt**: `string`

Defined in: [core/src/types/approval.ts:51](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L51)

Creation time, self-asserted and never used to decide.

#### Pattern

^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$

#### Example

```ts
"2026-10-22T09:14:03.120Z"
```

***

### environment?

> `optional` **environment?**: [`ReleaseEnvironmentName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/ReleaseEnvironmentName/index.md)

Defined in: [core/src/types/approval.ts:53](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L53)

The only environment the approval counts for. Absent means every environment.

***

### prompt

> **prompt**: `string`

Defined in: [core/src/types/approval.ts:36](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L36)

Prompt id, `<@meta.id>/<key>`. No segment ends with a dot.

#### Pattern

^(?!.*\.\.)(?:@?[A-Za-z0-9][A-Za-z0-9_.-]{0,63}(?<!\.)/)+[A-Za-z0-9][A-Za-z0-9_-]{0,63}$

#### Example

```ts
"acme-support/refund-reply"
```

***

### role

> **role**: [`GovernanceRoleName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/GovernanceRoleName/index.md)

Defined in: [core/src/types/approval.ts:43](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L43)

Approval role from `governance.roles`

***

### signature?

> `optional` **signature?**: `string`

Defined in: [core/src/types/approval.ts:71](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L71)

Armored SSH signature over the UTF-8 bytes of the RFC 8785 canonical JSON
(`canonicalizeJson`) of the record without `signature`; `signatureType` is
included. The signing namespace is `promptscript-approval-<role>`.
Reserved, not written or read in this version.

#### Max Length

8192

#### Pattern

^-----BEGIN SSH SIGNATURE-----\n[A-Za-z0-9+/=\n]{1,8192}-----END SSH SIGNATURE-----\n?$

***

### signatureType?

> `optional` **signatureType?**: `"ssh"`

Defined in: [core/src/types/approval.ts:62](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/approval.ts#L62)

Signature format, see `signature`. Reserved, not written or read in this version.