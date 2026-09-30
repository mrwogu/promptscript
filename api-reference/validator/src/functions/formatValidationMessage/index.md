# formatValidationMessage()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatValidationMessage()

> **formatValidationMessage**(`message`, `options?`): `string`

Defined in: [validator/src/format.ts:78](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/format.ts#L78)

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