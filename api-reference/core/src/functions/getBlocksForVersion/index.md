# getBlocksForVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getBlocksForVersion()

> **getBlocksForVersion**(`version`): readonly `string`[] \| `undefined`

Defined in: [core/src/syntax-versions.ts:190](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/core/src/syntax-versions.ts#L190)

Get the list of valid blocks for a known syntax version.

## Parameters

### version

`string`

## Returns

readonly `string`[] \| `undefined`

Block list, or undefined if version is unknown