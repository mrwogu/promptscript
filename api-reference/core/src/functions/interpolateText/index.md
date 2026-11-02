# interpolateText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: interpolateText()

> **interpolateText**(`text`, `ctx`): `string`

Defined in: [core/src/template.ts:228](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/template.ts#L228)

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