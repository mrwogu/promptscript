# filterBlocks()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: filterBlocks()

> **filterBlocks**(`blocks`, `options`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

Defined in: [resolver/src/imports.ts:115](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/resolver/src/imports.ts#L115)

Filter an array of blocks based on only/exclude criteria.
Returns a new array; does not mutate the input.

## Parameters

### blocks

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

### options

[`BlockFilterOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/BlockFilterOptions/index.md)

## Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]