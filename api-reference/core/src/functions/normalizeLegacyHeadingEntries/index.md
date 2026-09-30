# normalizeLegacyHeadingEntries()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: normalizeLegacyHeadingEntries()

> **normalizeLegacyHeadingEntries**(`blockName`, `entries`, `syntaxVersion`): readonly [`BlockEntry`](https://getpromptscript.dev/api-reference/core/src/type-aliases/BlockEntry/index.md)[]

Defined in: [core/src/presentation.ts:85](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/presentation.ts#L85)

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