# formatDiagnostics()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatDiagnostics()

> **formatDiagnostics**(`diagnostics`, `options?`): `string`

Defined in: [core/src/utils/diagnostic.ts:141](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/diagnostic.ts#L141)

Format multiple diagnostics for display.

## Parameters

### diagnostics

[`Diagnostic`](https://getpromptscript.dev/api-reference/core/src/interfaces/Diagnostic/index.md)[]

Array of diagnostics to format

### options?

[`FormatDiagnosticOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/FormatDiagnosticOptions/index.md) = `{}`

Formatting options

## Returns

`string`

Formatted string with newlines between diagnostics