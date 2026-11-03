# getBlocksForVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getBlocksForVersion()

> **getBlocksForVersion**(`version`): readonly `string`[] \| `undefined`

Defined in: [core/src/syntax-versions.ts:232](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/syntax-versions.ts#L232)

Get the list of valid blocks for a known syntax version.

## Parameters

### version

`string`

## Returns

readonly `string`[] \| `undefined`

Block list, or undefined if version is unknown