# StructuredMergeOperation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: StructuredMergeOperation

Defined in: [core/src/structured-output.ts:11](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/structured-output.ts#L11)

A single merge operation to apply to a structured settings file.

## Properties

### path

> **path**: `string`

Defined in: [core/src/structured-output.ts:13](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/structured-output.ts#L13)

Dotted path to the target key.

***

### value

> **value**: `unknown`

Defined in: [core/src/structured-output.ts:15](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/structured-output.ts#L15)

Value to set, or undefined to remove an owned value.