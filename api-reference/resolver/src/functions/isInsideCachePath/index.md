# isInsideCachePath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isInsideCachePath()

> **isInsideCachePath**(`filePath`, `cachePath`): `boolean`

Defined in: [resolver/src/reference-hasher.ts:29](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/resolver/src/reference-hasher.ts#L29)

Verify that a resolved file path is contained within the cache directory.
Prevents path traversal attacks via symlinks or `../` in reference paths.

## Parameters

### filePath

`string`

### cachePath

`string`

## Returns

`boolean`