# formatValidationResult()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: formatValidationResult()

> **formatValidationResult**(`result`, `options?`): `string`

Defined in: [validator/src/format.ts:162](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/validator/src/format.ts#L162)

Format a complete validation result for display.

## Parameters

### result

[`ValidationResult`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationResult/index.md)

Validation result to format

### options?

[`FormatValidationOptions`](https://getpromptscript.dev/api-reference/validator/src/interfaces/FormatValidationOptions/index.md) = `{}`

Formatting options

## Returns

`string`

Formatted string with summary

## Example

```typescript
const result = validator.validate(ast);
console.log(formatValidationResult(result, { color: true }));
// ✖ 2 errors, ⚠ 1 warning
// project.prs:1:1 - error: Missing required @meta.id field
// ...
```