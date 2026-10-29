# isKnownTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isKnownTarget()

> **isKnownTarget**(`name`): `name is KnownTarget`

Defined in: [core/src/types/config.ts:871](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/types/config.ts#L871)

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