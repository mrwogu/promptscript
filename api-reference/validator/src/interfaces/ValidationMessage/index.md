# ValidationMessage

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidationMessage

Defined in: [validator/src/types.ts:20](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L20)

A validation message produced by a rule.

## Properties

### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [validator/src/types.ts:30](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L30)

Source location where the issue was found

***

### message

> **message**: `string`

Defined in: [validator/src/types.ts:28](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L28)

Human-readable message

***

### ruleId

> **ruleId**: `string`

Defined in: [validator/src/types.ts:22](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L22)

Rule identifier (e.g., "PS001")

***

### ruleName

> **ruleName**: `string`

Defined in: [validator/src/types.ts:24](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L24)

Rule name (e.g., "required-meta-id")

***

### severity

> **severity**: [`Severity`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/Severity/index.md)

Defined in: [validator/src/types.ts:26](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L26)

Message severity

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [validator/src/types.ts:32](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/validator/src/types.ts#L32)

Suggested fix