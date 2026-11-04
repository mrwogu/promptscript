# isKnownTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isKnownTarget()

> **isKnownTarget**(`name`): `name is KnownTarget`

Defined in: [core/src/types/config.ts:972](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L972)

Type guard to check if a target name is a known built-in target.
Useful for narrowing `TargetName` to `KnownTarget` in switch statements
and enabling exhaustiveness checks.

## Parameters

### name

`string`

The target name to check

## Returns

`name is KnownTarget`

True if the name is a known built-in target