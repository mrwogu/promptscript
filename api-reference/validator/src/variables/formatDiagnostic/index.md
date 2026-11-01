# formatDiagnostic

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: formatDiagnostic

> `const` **formatDiagnostic**: (`message`, `options`) => `string` = `formatValidationMessage`

Defined in: [validator/src/format.ts:139](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/format.ts#L139)

Alias for formatValidationMessage (for consistency with docs).

Format a single validation message for display.

## Parameters

### message

[`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)

Validation message to format

### options?

[`FormatValidationOptions`](https://getpromptscript.dev/api-reference/validator/src/interfaces/FormatValidationOptions/index.md) = `{}`

Formatting options

## Returns

`string`

Formatted string

## Example

```typescript
const message = {
  ruleId: 'PS001',
  ruleName: 'required-meta-id',
  severity: 'error',
  message: 'Missing required @meta.id field',
  location: { file: 'project.prs', line: 1, column: 1 }
};

formatValidationMessage(message)
// 'project.prs:1:1 - error: Missing required @meta.id field'

formatValidationMessage(message, { includeRuleId: true })
// 'project.prs:1:1 - error [PS001]: Missing required @meta.id field'
```