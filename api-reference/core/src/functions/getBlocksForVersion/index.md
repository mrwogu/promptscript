# getBlocksForVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getBlocksForVersion()

> **getBlocksForVersion**(`version`): readonly `string`[] \| `undefined`

Defined in: [core/src/syntax-versions.ts:232](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/core/src/syntax-versions.ts#L232)

Get the list of valid blocks for a known syntax version.

## Parameters

### version

`string`

## Returns

readonly `string`[] \| `undefined`

Block list, or undefined if version is unknown