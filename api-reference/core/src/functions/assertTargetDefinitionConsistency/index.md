# assertTargetDefinitionConsistency()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: assertTargetDefinitionConsistency()

> **assertTargetDefinitionConsistency**(`definitions?`): `void`

Defined in: [core/src/target-catalog.ts:870](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/target-catalog.ts#L870)

Throw when target definitions contradict the canonical output and feature metadata.

## Parameters

### definitions?

`Readonly`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetDefinition/index.md)\>\> = `TARGET_DEFINITIONS`

## Returns

`void`