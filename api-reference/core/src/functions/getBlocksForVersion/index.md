# getBlocksForVersion()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getBlocksForVersion()

> **getBlocksForVersion**(`version`): readonly `string`[] \| `undefined`

Defined in: [core/src/syntax-versions.ts:190](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/syntax-versions.ts#L190)

Get the list of valid blocks for a known syntax version.

## Parameters

### version

`string`

## Returns

readonly `string`[] \| `undefined`

Block list, or undefined if version is unknown