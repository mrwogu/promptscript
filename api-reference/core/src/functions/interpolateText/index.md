# interpolateText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateText()

> **interpolateText**(`text`, `ctx`): `string`

Defined in: [core/src/template.ts:226](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/template.ts#L226)

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