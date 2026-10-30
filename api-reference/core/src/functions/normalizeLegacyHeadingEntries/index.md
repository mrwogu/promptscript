# normalizeLegacyHeadingEntries()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeLegacyHeadingEntries()

> **normalizeLegacyHeadingEntries**(`blockName`, `entries`, `syntaxVersion`): readonly [`BlockEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockEntry/index.md)[]

Defined in: [core/src/presentation.ts:85](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/presentation.ts#L85)

Promote an initial text heading for opted-in blocks in syntax 1.5.0+.

## Parameters

### blockName

`string`

### entries

readonly [`BlockEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockEntry/index.md)[]

### syntaxVersion

`string` \| `undefined`

## Returns

readonly [`BlockEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockEntry/index.md)[]