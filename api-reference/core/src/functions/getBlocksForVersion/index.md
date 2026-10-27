# getBlocksForVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getBlocksForVersion()

> **getBlocksForVersion**(`version`): readonly `string`[] \| `undefined`

Defined in: [core/src/syntax-versions.ts:232](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/syntax-versions.ts#L232)

Get the list of valid blocks for a known syntax version.

## Parameters

### version

`string`

## Returns

readonly `string`[] \| `undefined`

Block list, or undefined if version is unknown