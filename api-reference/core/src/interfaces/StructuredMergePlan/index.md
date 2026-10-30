# StructuredMergePlan

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: StructuredMergePlan

Defined in: [core/src/structured-output.ts:21](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/structured-output.ts#L21)

Plan for merging generated values into a structured settings file.

## Properties

### format

> **format**: `"json"` \| `"toml"`

Defined in: [core/src/structured-output.ts:23](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/structured-output.ts#L23)

Target file format.

***

### operations

> **operations**: [`StructuredMergeOperation`](https://getpromptscript.dev/api-reference/core/src/interfaces/StructuredMergeOperation/index.md)[]

Defined in: [core/src/structured-output.ts:27](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/structured-output.ts#L27)

Merge operations to apply.

***

### owner

> **owner**: `string`

Defined in: [core/src/structured-output.ts:25](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/structured-output.ts#L25)

Owner identifier.