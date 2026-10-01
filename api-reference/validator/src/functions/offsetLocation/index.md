# offsetLocation()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: offsetLocation()

> **offsetLocation**(`baseLoc`, `text`, `charIndex`): [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [validator/src/walker.ts:219](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/walker.ts#L219)

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