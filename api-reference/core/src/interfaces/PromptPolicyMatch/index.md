# PromptPolicyMatch

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: PromptPolicyMatch

Defined in: [core/src/types/policy.ts:74](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L74)

Selects the prompts a policy applies to. Keys combine with AND; no `match`
selects every prompt.

## Properties

### dataClasses?

> `optional` **dataClasses?**: `string`[]

Defined in: [core/src/types/policy.ts:86](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L86)

Any effective data class is one of these

#### Min Items

1

***

### domains?

> `optional` **domains?**: `string`[]

Defined in: [core/src/types/policy.ts:81](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L81)

Effective domain is one of these

#### Min Items

1

***

### minRisk?

> `optional` **minRisk?**: [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [core/src/types/policy.ts:76](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/types/policy.ts#L76)

Policy risk is at or above this level