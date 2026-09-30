# validateTargetCapabilities()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateTargetCapabilities()

> **validateTargetCapabilities**(`capabilities`): `string`[]

Defined in: [core/src/target-capabilities.ts:1628](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L1628)

Return actionable issues in a capability registry.

This check is intentionally independent from formatter implementations so
core consumers can validate metadata without importing the formatter package.

## Parameters

### capabilities

`Readonly`\<`Partial`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md)\>\>\>

## Returns

`string`[]