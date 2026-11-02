# getTargetDefinition()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getTargetDefinition()

> **getTargetDefinition**(`name`): [`TargetDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetDefinition/index.md)

Defined in: [core/src/target-catalog.ts:891](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/target-catalog.ts#L891)

Get the target definition for a known target.

## Parameters

### name

[`KnownTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/KnownTarget/index.md)

The target name

## Returns

[`TargetDefinition`](https://getpromptscript.dev/api-reference/core/src/interfaces/TargetDefinition/index.md)

The target definition

## Throws

if the target name is not a known target