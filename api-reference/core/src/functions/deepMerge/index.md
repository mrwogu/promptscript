# deepMerge()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: deepMerge()

> **deepMerge**\<`T`\>(`parent`, `child`, `options?`): `T`

Defined in: [core/src/utils/merge.ts:40](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/merge.ts#L40)

Deep merge two objects following PromptScript inheritance rules.

Rules:
- Objects: deep merge (child wins on conflict)
- Arrays: strategy-dependent (default: unique concat)
- TextContent: concatenate (parent + child)
- Primitives: child wins

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