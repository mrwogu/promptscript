# validateTargetCapabilities()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateTargetCapabilities()

> **validateTargetCapabilities**(`capabilities`): `string`[]

Defined in: [core/src/target-capabilities.ts:1650](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/target-capabilities.ts#L1650)

Return actionable issues in a capability registry.

This check is intentionally independent from formatter implementations so
core consumers can validate metadata without importing the formatter package.

## Parameters

### capabilities

`Readonly`\<`Partial`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md)\>\>\>

## Returns

`string`[]