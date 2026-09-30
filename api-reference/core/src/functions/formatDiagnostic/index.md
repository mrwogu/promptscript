# formatDiagnostic()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatDiagnostic()

> **formatDiagnostic**(`diagnostic`, `options?`): `string`

Defined in: [core/src/utils/diagnostic.ts:89](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/diagnostic.ts#L89)

Format a diagnostic for display.

## Parameters

### diagnostic

[`Diagnostic`](https://getpromptscript.dev/api-reference/core/src/interfaces/Diagnostic/index.md)

Diagnostic to format

### options?

[`FormatDiagnosticOptions`](https://getpromptscript.dev/api-reference/core/src/interfaces/FormatDiagnosticOptions/index.md) = `{}`

Formatting options

## Returns

`string`

Formatted string

## Example

```typescript
const diagnostic = {
  message: 'Missing required field: id',
  severity: 'error',
  location: { file: 'project.prs', line: 5, column: 3 },
  code: 'E001',
  source: 'meta-validator'
};

formatDiagnostic(diagnostic)
// 'project.prs:5:3 - error E001: Missing required field: id'

formatDiagnostic(diagnostic, { color: true })
// '\x1b[31mproject.prs:5:3 - error E001: Missing required field: id\x1b[0m'
```