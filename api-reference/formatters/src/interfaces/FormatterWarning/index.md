# FormatterWarning

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: FormatterWarning

Defined in: [formatters/src/types.ts:13](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L13)

## Properties

### code

> **code**: `string`

Defined in: [formatters/src/types.ts:15](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L15)

Stable warning code

***

### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [formatters/src/types.ts:23](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L23)

Source location that caused the compatibility warning

***

### message

> **message**: `string`

Defined in: [formatters/src/types.ts:19](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L19)

Actionable compatibility message

***

### ruleName?

> `optional` **ruleName?**: `string`

Defined in: [formatters/src/types.ts:17](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L17)

Rule name reported to compile consumers (defaults per code family)

***

### suggestion?

> `optional` **suggestion?**: `string`

Defined in: [formatters/src/types.ts:21](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/formatters/src/types.ts#L21)

Optional remediation