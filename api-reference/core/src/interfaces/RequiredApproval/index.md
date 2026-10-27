# RequiredApproval

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RequiredApproval

Defined in: [core/src/types/policy.ts:155](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L155)

Approvals one role must give.

## Properties

### count?

> `optional` **count?**: `number`

Defined in: [core/src/types/policy.ts:166](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L166)

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

Defined in: [core/src/types/policy.ts:157](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/policy.ts#L157)

Role from `governance.roles`