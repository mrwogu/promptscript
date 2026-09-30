# deepMerge()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: deepMerge()

> **deepMerge**\<`T`\>(`parent`, `child`, `options?`): `T`

Defined in: [core/src/utils/merge.ts:40](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/merge.ts#L40)

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