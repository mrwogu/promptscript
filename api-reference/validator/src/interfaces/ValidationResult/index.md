# ValidationResult

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidationResult

Defined in: [validator/src/types.ts:40](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/types.ts#L40)

Result of validating an AST.

## Properties

### all

> **all**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [validator/src/types.ts:50](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/types.ts#L50)

All messages combined

***

### errors

> **errors**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [validator/src/types.ts:44](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/types.ts#L44)

All error-level messages

***

### infos

> **infos**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [validator/src/types.ts:48](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/types.ts#L48)

All info-level messages

***

### valid

> **valid**: `boolean`

Defined in: [validator/src/types.ts:42](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/types.ts#L42)

True if no errors were found

***

### warnings

> **warnings**: [`ValidationMessage`](https://getpromptscript.dev/api-reference/validator/src/interfaces/ValidationMessage/index.md)[]

Defined in: [validator/src/types.ts:46](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/validator/src/types.ts#L46)

All warning-level messages