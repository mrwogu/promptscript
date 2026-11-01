# deepMerge()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: deepMerge()

> **deepMerge**\<`T`\>(`parent`, `child`, `options?`): `T`

Defined in: [core/src/utils/merge.ts:52](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/utils/merge.ts#L52)

Deep merge two objects following PromptScript inheritance rules.

Rules:
- Objects: deep merge (child wins on conflict)
- Arrays: strategy-dependent (default: unique concat)
- TextContent: concatenate (parent + child)
- Primitives: child wins

Only own properties are read and written, so nothing comes from or goes to a prototype.

## Type Parameters

### T

`T` *extends* `Record`\<`string`, `unknown`\>

## Parameters

### parent

`T`

Parent object

### child

`Partial`\<`T`\>

Child object (takes precedence)

### options?

`Partial`\<`MergeOptions`\> = `{}`

Merge options

## Returns

`T`

Merged object

## Throws

PSError (`INVALID_VALUE`) when either side has a `__proto__`, `constructor` or
`prototype` key in an object that is merged, at the top or at a path both sides share