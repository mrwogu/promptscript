# validParams

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Variable: validParams

> `const` **validParams**: [`ValidationRule`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationRule/index.md)

Defined in: [validator/src/rules/valid-params.ts:129](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/validator/src/rules/valid-params.ts#L129)

PS009: Valid parameter definitions

Validates:
- No duplicate parameter names
- Default values match declared types
- Optional parameters with defaults are consistent
- Default values of typed block fields match their declared types