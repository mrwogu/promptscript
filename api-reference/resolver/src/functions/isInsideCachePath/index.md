# isInsideCachePath()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: isInsideCachePath()

> **isInsideCachePath**(`filePath`, `cachePath`): `boolean`

Defined in: [resolver/src/reference-hasher.ts:29](https://github.com/mrwogu/promptscript/blob/2f8713a5e2c669137313fe996620094cb7a470e9/packages/resolver/src/reference-hasher.ts#L29)

Verify that a resolved file path is contained within the cache directory.
Prevents path traversal attacks via symlinks or `../` in reference paths.

## Parameters

### filePath

`string`

### cachePath

`string`

## Returns

`boolean`