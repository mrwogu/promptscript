# filterBlocks()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: filterBlocks()

> **filterBlocks**(`blocks`, `options`): [`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

Defined in: [resolver/src/imports.ts:115](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/imports.ts#L115)

Filter an array of blocks based on only/exclude criteria.
Returns a new array; does not mutate the input.

## Parameters

### blocks

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]

### options

[`BlockFilterOptions`](https://getpromptscript.dev/api-reference/resolver/src/interfaces/BlockFilterOptions/index.md)

## Returns

[`Block`](https://getpromptscript.dev/api-reference/core/src/interfaces/Block/index.md)[]