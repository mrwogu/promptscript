# Diagnostic

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: Diagnostic

Defined in: [core/src/utils/diagnostic.ts:11](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/diagnostic.ts#L11)

A diagnostic message with location information.

## Properties

### code?

> `optional` **code?**: `string`

Defined in: [core/src/utils/diagnostic.ts:19](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/diagnostic.ts#L19)

Optional diagnostic code

***

### location?

> `optional` **location?**: [`SourceLocation`](https://getpromptscript.dev/api-reference/core/src/interfaces/SourceLocation/index.md)

Defined in: [core/src/utils/diagnostic.ts:17](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/diagnostic.ts#L17)

Source location

***

### message

> **message**: `string`

Defined in: [core/src/utils/diagnostic.ts:13](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/diagnostic.ts#L13)

Diagnostic message

***

### severity

> **severity**: [`DiagnosticSeverity`](https://getpromptscript.dev/api-reference/core/src/type-aliases/DiagnosticSeverity/index.md)

Defined in: [core/src/utils/diagnostic.ts:15](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/diagnostic.ts#L15)

Severity level

***

### source?

> `optional` **source?**: `string`

Defined in: [core/src/utils/diagnostic.ts:21](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/diagnostic.ts#L21)

Optional source (e.g., rule name)