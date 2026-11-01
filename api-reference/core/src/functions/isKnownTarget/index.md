# isKnownTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isKnownTarget()

> **isKnownTarget**(`name`): `name is KnownTarget`

Defined in: [core/src/types/config.ts:873](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L873)

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