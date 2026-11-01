# assertValidTargetCapabilities()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: assertValidTargetCapabilities()

> **assertValidTargetCapabilities**(`capabilities`): `void`

Defined in: [core/src/target-capabilities.ts:1780](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/target-capabilities.ts#L1780)

Throw when a capability registry contains missing or contradictory metadata.

## Parameters

### capabilities

`Readonly`\<`Partial`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetCapability`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetCapability/index.md)\>\>\>

## Returns

`void`