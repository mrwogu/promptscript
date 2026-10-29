# getCacheDir()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getCacheDir()

> **getCacheDir**(): `string`

Defined in: [cli/src/utils/version-check.ts:92](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/utils/version-check.ts#L92)

Get the cache directory path.
Uses ~/.promptscript/.cache/ for consistency with Git registry cache.

- All platforms: ~/.promptscript/.cache/

## Returns

`string`