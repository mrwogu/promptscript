# parseVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseVersion()

> **parseVersion**(`version`): `SemVer`

Defined in: [core/src/utils/version.ts:25](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/utils/version.ts#L25)

Parse a semantic version string.

## Parameters

### version

`string`

Version string (e.g., "1.2.3", "1.0.0-beta.1")

## Returns

`SemVer`

Parsed version object

## Throws

If version format is invalid