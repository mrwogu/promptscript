# RequiredApproval

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RequiredApproval

Defined in: [core/src/types/policy.ts:156](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L156)

Approvals one role must give.

## Properties

### count?

> `optional` **count?**: `number`

Defined in: [core/src/types/policy.ts:167](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L167)

Distinct approvers needed. Only 1 is accepted while approval records are
unsigned, since unsigned records cannot tell two approvers apart under one review.

#### As Type

integer

#### Minimum

1

#### Maximum

1

#### Default

```ts
1
```

***

### role

> **role**: [`GovernanceRoleName`](https://getpromptscript.dev/api-reference/core/src/type-aliases/GovernanceRoleName/index.md)

Defined in: [core/src/types/policy.ts:158](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L158)

Role from `governance.roles`