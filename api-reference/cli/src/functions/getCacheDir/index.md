# getCacheDir()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getCacheDir()

> **getCacheDir**(): `string`

Defined in: [cli/src/utils/version-check.ts:93](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/cli/src/utils/version-check.ts#L93)

Get the cache directory path.
Uses ~/.promptscript/.cache/ for consistency with Git registry cache.

- All platforms: ~/.promptscript/.cache/

## Returns

`string`