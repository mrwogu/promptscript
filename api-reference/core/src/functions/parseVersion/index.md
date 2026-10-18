# parseVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: parseVersion()

> **parseVersion**(`version`): `SemVer`

Defined in: [core/src/utils/version.ts:25](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/utils/version.ts#L25)

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