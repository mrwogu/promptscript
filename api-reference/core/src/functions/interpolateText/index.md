# interpolateText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateText()

> **interpolateText**(`text`, `ctx`): `string`

Defined in: [core/src/template.ts:226](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/template.ts#L226)

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