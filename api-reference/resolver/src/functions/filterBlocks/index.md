# filterBlocks()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: filterBlocks()

> **filterBlocks**(`blocks`, `options`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

Defined in: [resolver/src/imports.ts:115](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/resolver/src/imports.ts#L115)

Filter an array of blocks based on only/exclude criteria.
Returns a new array; does not mutate the input.

## Parameters

### blocks

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

### options

[`BlockFilterOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/BlockFilterOptions/index.md)

## Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]