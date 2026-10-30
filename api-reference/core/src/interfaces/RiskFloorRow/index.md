# RiskFloorRow

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RiskFloorRow

Defined in: [core/src/types/policy.ts:108](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L108)

One row of a risk floor. The row matches when any of its conditions matches.

## Min Properties

2

## Properties

### dataClasses?

> `optional` **dataClasses?**: `string`[]

Defined in: [core/src/types/policy.ts:113](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L113)

Any effective data class is one of these

#### Min Items

1

***

### domains?

> `optional` **domains?**: `string`[]

Defined in: [core/src/types/policy.ts:118](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L118)

Effective domain is one of these

#### Min Items

1

***

### inputTypes?

> `optional` **inputTypes?**: (`"string"` \| `"number"` \| `"boolean"` \| `"enum"`)[]

Defined in: [core/src/types/policy.ts:123](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L123)

Any input has one of these types

#### Min Items

1

***

### minimum

> **minimum**: [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [core/src/types/policy.ts:125](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/policy.ts#L125)

Lowest policy risk of a matching prompt