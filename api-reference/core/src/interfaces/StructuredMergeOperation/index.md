# StructuredMergeOperation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: StructuredMergeOperation

Defined in: [core/src/structured-output.ts:11](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/structured-output.ts#L11)

A single merge operation to apply to a structured settings file.

## Properties

### path

> **path**: `string`

Defined in: [core/src/structured-output.ts:13](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/structured-output.ts#L13)

Dotted path to the target key.

***

### value

> **value**: `unknown`

Defined in: [core/src/structured-output.ts:15](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/structured-output.ts#L15)

Value to set, or undefined to remove an owned value.