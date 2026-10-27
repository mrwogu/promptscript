# assertTargetDefinitionConsistency()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: assertTargetDefinitionConsistency()

> **assertTargetDefinitionConsistency**(`definitions?`): `void`

Defined in: [core/src/target-catalog.ts:870](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/target-catalog.ts#L870)

Throw when target definitions contradict the canonical output and feature metadata.

## Parameters

### definitions?

`Readonly`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetDefinition/index.md)\>\> = `TARGET_DEFINITIONS`

## Returns

`void`