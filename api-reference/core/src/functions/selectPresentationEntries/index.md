# selectPresentationEntries()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: selectPresentationEntries()

> **selectPresentationEntries**(`baseEntries`, `incomingEntries`, `precedence`, `blockName?`): [`PresentationSelection`](https://getpromptscript.dev/api-reference/core/src/interfaces/PresentationSelection/index.md)

Defined in: [core/src/presentation.ts:40](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/presentation.ts#L40)

Select presentation metadata by source rank and operation precedence.

## Parameters

### baseEntries

readonly [`BlockEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockEntry/index.md)[]

### incomingEntries

readonly [`BlockEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockEntry/index.md)[]

### precedence

[`PresentationPrecedence`](https://getpromptscript.dev/api-reference/core/src/type-aliases/PresentationPrecedence/index.md)

### blockName?

`string`

## Returns

[`PresentationSelection`](https://getpromptscript.dev/api-reference/core/src/interfaces/PresentationSelection/index.md)