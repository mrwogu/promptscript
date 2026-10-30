# ValidationMessage

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: ValidationMessage

Defined in: [validator/src/types.ts:22](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/types.ts#L22)

A validation message produced by a rule.

## Properties

### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [validator/src/types.ts:32](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/types.ts#L32)

Source location where the issue was found

***

### message

> **message**: `string`

Defined in: [validator/src/types.ts:30](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/types.ts#L30)

Human-readable message

***

### ruleId

> **ruleId**: `string`

Defined in: [validator/src/types.ts:24](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/types.ts#L24)

Rule identifier (e.g., "PS001")

***

### ruleName

> **ruleName**: `string`

Defined in: [validator/src/types.ts:26](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/types.ts#L26)

Rule name (e.g., "required-meta-id")

***

### severity

> **severity**: [`Severity`](https://getpromptscript.dev/api-reference/validator/src/type-aliases/Severity/index.md)

Defined in: [validator/src/types.ts:28](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/types.ts#L28)

Message severity

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [validator/src/types.ts:34](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/types.ts#L34)

Suggested fix