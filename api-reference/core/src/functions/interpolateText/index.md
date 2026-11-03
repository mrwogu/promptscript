# interpolateText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateText()

> **interpolateText**(`text`, `ctx`): `string`

Defined in: [core/src/template.ts:228](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/core/src/template.ts#L228)

Interpolate template variables in a text string.

## Parameters

### text

`string`

Text containing {{variable}} placeholders

### ctx

[`TemplateContext`](https://getpromptscript.dev/api-reference/core/src/interfaces/TemplateContext/index.md)

Template context with bound parameters

## Returns

`string`

Interpolated text

## Throws

UndefinedVariableError if a variable is used but not defined