# ValidationResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidationResult

Defined in: [validator/src/types.ts:40](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/types.ts#L40)

Result of validating an AST.

## Properties

### all

> **all**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [validator/src/types.ts:50](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/types.ts#L50)

All messages combined

***

### errors

> **errors**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [validator/src/types.ts:44](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/types.ts#L44)

All error-level messages

***

### infos

> **infos**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [validator/src/types.ts:48](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/types.ts#L48)

All info-level messages

***

### valid

> **valid**: `boolean`

Defined in: [validator/src/types.ts:42](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/types.ts#L42)

True if no errors were found

***

### warnings

> **warnings**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [validator/src/types.ts:46](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/validator/src/types.ts#L46)

All warning-level messages