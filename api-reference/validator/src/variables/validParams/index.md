# validParams

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: validParams

> `const` **validParams**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/valid-params.ts:129](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/rules/valid-params.ts#L129)

PS009: Valid parameter definitions

Validates:
- No duplicate parameter names
- Default values match declared types
- Optional parameters with defaults are consistent
- Default values of typed block fields match their declared types