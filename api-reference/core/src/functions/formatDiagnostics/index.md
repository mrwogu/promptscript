# formatDiagnostics()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatDiagnostics()

> **formatDiagnostics**(`diagnostics`, `options?`): `string`

Defined in: [core/src/utils/diagnostic.ts:141](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/utils/diagnostic.ts#L141)

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