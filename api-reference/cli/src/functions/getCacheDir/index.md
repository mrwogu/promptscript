# getCacheDir()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getCacheDir()

> **getCacheDir**(): `string`

Defined in: [cli/src/utils/version-check.ts:92](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/cli/src/utils/version-check.ts#L92)

Get the cache directory path.
Uses ~/.promptscript/.cache/ for consistency with Git registry cache.

- All platforms: ~/.promptscript/.cache/

## Returns

`string`