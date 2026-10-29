# formatDiagnostics

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: formatDiagnostics

> `const` **formatDiagnostics**: (`messages`, `options`) => `string` = `formatValidationMessages`

Defined in: [validator/src/format.ts:144](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/format.ts#L144)

Alias for formatValidationMessages (for consistency with docs).

Format multiple validation messages for display.

## Parameters

### messages

[`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Array of validation messages

### options?

[`FormatValidationOptions`](https://getpromptscript.dev/api-reference/validator/src/interfaces/FormatValidationOptions/index.md) = `{}`

Formatting options

## Returns

`string`

Formatted string with newlines between messages