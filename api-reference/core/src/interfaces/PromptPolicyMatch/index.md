# PromptPolicyMatch

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptPolicyMatch

Defined in: [core/src/types/policy.ts:73](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L73)

Selects the prompts a policy applies to. Keys combine with AND; no `match`
selects every prompt.

## Properties

### dataClasses?

> `optional` **dataClasses?**: `string`[]

Defined in: [core/src/types/policy.ts:85](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L85)

Any effective data class is one of these

#### Min Items

1

***

### domains?

> `optional` **domains?**: `string`[]

Defined in: [core/src/types/policy.ts:80](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L80)

Effective domain is one of these

#### Min Items

1

***

### minRisk?

> `optional` **minRisk?**: [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [core/src/types/policy.ts:75](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L75)

Policy risk is at or above this level