# isKnownTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isKnownTarget()

> **isKnownTarget**(`name`): `name is KnownTarget`

Defined in: [core/src/types/config.ts:873](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/types/config.ts#L873)

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