# PromptPolicyMatch

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptPolicyMatch

Defined in: [core/src/types/policy.ts:78](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L78)

Selects the prompts a policy applies to. Keys combine with AND; no `match`
selects every prompt.

## Properties

### dataClasses?

> `optional` **dataClasses?**: `string`[]

Defined in: [core/src/types/policy.ts:90](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L90)

Any effective data class is one of these

#### Min Items

1

***

### domains?

> `optional` **domains?**: `string`[]

Defined in: [core/src/types/policy.ts:85](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L85)

Effective domain is one of these

#### Min Items

1

***

### minRisk?

> `optional` **minRisk?**: [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [core/src/types/policy.ts:80](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/types/policy.ts#L80)

Policy risk is at or above this level