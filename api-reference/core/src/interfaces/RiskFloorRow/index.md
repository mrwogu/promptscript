# RiskFloorRow

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: RiskFloorRow

Defined in: [core/src/types/policy.ts:107](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L107)

One row of a risk floor. The row matches when any of its conditions matches.

## Min Properties

2

## Properties

### dataClasses?

> `optional` **dataClasses?**: `string`[]

Defined in: [core/src/types/policy.ts:112](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L112)

Any effective data class is one of these

#### Min Items

1

***

### domains?

> `optional` **domains?**: `string`[]

Defined in: [core/src/types/policy.ts:117](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L117)

Effective domain is one of these

#### Min Items

1

***

### inputTypes?

> `optional` **inputTypes?**: (`"string"` \| `"number"` \| `"boolean"` \| `"enum"`)[]

Defined in: [core/src/types/policy.ts:122](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L122)

Any input has one of these types

#### Min Items

1

***

### minimum

> **minimum**: [`RiskLevel`](https://getpromptscript.dev/api-reference/core/src/type-aliases/RiskLevel/index.md)

Defined in: [core/src/types/policy.ts:124](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/policy.ts#L124)

Lowest policy risk of a matching prompt