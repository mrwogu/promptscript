# getCacheDir()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getCacheDir()

> **getCacheDir**(): `string`

Defined in: [cli/src/utils/version-check.ts:93](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/cli/src/utils/version-check.ts#L93)

Get the cache directory path.
Uses ~/.promptscript/.cache/ for consistency with Git registry cache.

- All platforms: ~/.promptscript/.cache/

## Returns

`string`