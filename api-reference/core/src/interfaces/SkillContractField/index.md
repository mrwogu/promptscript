# SkillContractField

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: SkillContractField

Defined in: [core/src/types/ast.ts:840](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L840)

A field in a skill contract (input or output).

## Properties

### default?

> `optional` **default?**: [`Value`](https://getpromptscript.dev/api-reference/core/src/type-aliases/Value/index.md)

Defined in: [core/src/types/ast.ts:848](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L848)

Default value

***

### description

> **description**: `string`

Defined in: [core/src/types/ast.ts:842](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L842)

Description of the field

***

### options?

> `optional` **options?**: `string`[]

Defined in: [core/src/types/ast.ts:846](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L846)

Options for enum type

***

### type

> **type**: `"string"` \| `"number"` \| `"boolean"` \| `"enum"`

Defined in: [core/src/types/ast.ts:844](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/ast.ts#L844)

Value type