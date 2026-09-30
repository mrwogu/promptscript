# assertValidTargetCapabilities()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: assertValidTargetCapabilities()

> **assertValidTargetCapabilities**(`capabilities`): `void`

Defined in: [core/src/target-capabilities.ts:1758](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/target-capabilities.ts#L1758)

Throw when a capability registry contains missing or contradictory metadata.

## Parameters

### capabilities

`Readonly`\<`Partial`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md)\>\>\>

## Returns

`void`