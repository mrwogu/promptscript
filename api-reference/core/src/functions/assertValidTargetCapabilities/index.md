# assertValidTargetCapabilities()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: assertValidTargetCapabilities()

> **assertValidTargetCapabilities**(`capabilities`): `void`

Defined in: [core/src/target-capabilities.ts:1780](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-capabilities.ts#L1780)

Throw when a capability registry contains missing or contradictory metadata.

## Parameters

### capabilities

`Readonly`\<`Partial`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md)\>\>\>

## Returns

`void`