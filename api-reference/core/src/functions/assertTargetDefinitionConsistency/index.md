# assertTargetDefinitionConsistency()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: assertTargetDefinitionConsistency()

> **assertTargetDefinitionConsistency**(`definitions?`): `void`

Defined in: [core/src/target-catalog.ts:870](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-catalog.ts#L870)

Throw when target definitions contradict the canonical output and feature metadata.

## Parameters

### definitions?

`Readonly`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetDefinition/index.md)\>\> = `TARGET_DEFINITIONS`

## Returns

`void`