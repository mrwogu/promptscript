# RequiredApproval

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RequiredApproval

Defined in: [core/src/types/policy.ts:155](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L155)

Approvals one role must give.

## Properties

### count?

> `optional` **count?**: `number`

Defined in: [core/src/types/policy.ts:166](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L166)

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

Defined in: [core/src/types/policy.ts:157](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L157)

Role from `governance.roles`