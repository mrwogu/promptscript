# validParams

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: validParams

> `const` **validParams**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/valid-params.ts:129](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/validator/src/rules/valid-params.ts#L129)

PS009: Valid parameter definitions

Validates:
- No duplicate parameter names
- Default values match declared types
- Optional parameters with defaults are consistent
- Default values of typed block fields match their declared types