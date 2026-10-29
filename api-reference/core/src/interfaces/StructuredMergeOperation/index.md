# StructuredMergeOperation

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: StructuredMergeOperation

Defined in: [core/src/structured-output.ts:11](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/structured-output.ts#L11)

A single merge operation to apply to a structured settings file.

## Properties

### path

> **path**: `string`

Defined in: [core/src/structured-output.ts:13](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/structured-output.ts#L13)

Dotted path to the target key.

***

### value

> **value**: `unknown`

Defined in: [core/src/structured-output.ts:15](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/structured-output.ts#L15)

Value to set, or undefined to remove an owned value.