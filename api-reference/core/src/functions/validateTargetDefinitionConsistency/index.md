# validateTargetDefinitionConsistency()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateTargetDefinitionConsistency()

> **validateTargetDefinitionConsistency**(`definitions?`): `string`[]

Defined in: [core/src/target-catalog.ts:809](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/target-catalog.ts#L809)

Return contradictions between the target catalog and its capability data.

## Parameters

### definitions?

`Readonly`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetDefinition/index.md)\>\> = `TARGET_DEFINITIONS`

## Returns

`string`[]