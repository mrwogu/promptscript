# parseVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseVersion()

> **parseVersion**(`version`): `SemVer`

Defined in: [core/src/utils/version.ts:25](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/core/src/utils/version.ts#L25)

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