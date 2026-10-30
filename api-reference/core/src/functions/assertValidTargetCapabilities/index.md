# assertValidTargetCapabilities()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: assertValidTargetCapabilities()

> **assertValidTargetCapabilities**(`capabilities`): `void`

Defined in: [core/src/target-capabilities.ts:1780](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/target-capabilities.ts#L1780)

Throw when a capability registry contains missing or contradictory metadata.

## Parameters

### capabilities

`Readonly`\<`Partial`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md)\>\>\>

## Returns

`void`