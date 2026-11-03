# RequiredApproval

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RequiredApproval

Defined in: [core/src/types/policy.ts:160](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L160)

Approvals one role must give.

## Properties

### count?

> `optional` **count?**: `number`

Defined in: [core/src/types/policy.ts:171](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L171)

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

Defined in: [core/src/types/policy.ts:162](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L162)

Role from `governance.roles`