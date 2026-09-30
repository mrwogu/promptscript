# FormatterWarning

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatterWarning

Defined in: [formatters/src/types.ts:11](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L11)

## Properties

### code

> **code**: `string`

Defined in: [formatters/src/types.ts:13](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L13)

Stable warning code

***

### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [formatters/src/types.ts:21](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L21)

Source location that caused the compatibility warning

***

### message

> **message**: `string`

Defined in: [formatters/src/types.ts:17](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L17)

Actionable compatibility message

***

### ruleName?

> `optional` **ruleName?**: `string`

Defined in: [formatters/src/types.ts:15](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L15)

Rule name reported to compile consumers (defaults per code family)

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [formatters/src/types.ts:19](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/formatters/src/types.ts#L19)

Optional remediation