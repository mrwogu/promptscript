# validateTargetDefinitionConsistency()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: validateTargetDefinitionConsistency()

> **validateTargetDefinitionConsistency**(`definitions?`): `string`[]

Defined in: [core/src/target-catalog.ts:809](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/target-catalog.ts#L809)

Return contradictions between the target catalog and its capability data.

## Parameters

### definitions?

`Readonly`\<`Record`\<[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md), [`TargetDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetDefinition/index.md)\>\> = `TARGET_DEFINITIONS`

## Returns

`string`[]