# compareVersions()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: compareVersions()

> **compareVersions**(`a`, `b`): `CompareResult`

Defined in: [core/src/utils/version.ts:46](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/core/src/utils/version.ts#L46)

Compare two semantic versions.

## Parameters

### a

`string`

### b

`string`

## Returns

`CompareResult`

-1 if a < b, 0 if a === b, 1 if a > b