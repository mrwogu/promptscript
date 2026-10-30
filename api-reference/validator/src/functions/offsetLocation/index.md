# offsetLocation()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: offsetLocation()

> **offsetLocation**(`baseLoc`, `text`, `charIndex`): [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [validator/src/walker.ts:310](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/walker.ts#L310)

Compute the actual source location of a character offset within a text block.
Given the text block's starting location and a character index within the text,
returns the adjusted SourceLocation pointing to the exact line and column.

## Parameters

### baseLoc

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

### text

`string`

### charIndex

`number`

## Returns

[`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)