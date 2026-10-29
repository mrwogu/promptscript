# validParams

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: validParams

> `const` **validParams**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/valid-params.ts:129](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/rules/valid-params.ts#L129)

PS009: Valid parameter definitions

Validates:
- No duplicate parameter names
- Default values match declared types
- Optional parameters with defaults are consistent
- Default values of typed block fields match their declared types