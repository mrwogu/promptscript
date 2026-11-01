# getMinimumVersionForBlock()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getMinimumVersionForBlock()

> **getMinimumVersionForBlock**(`blockName`): `string` \| `undefined`

Defined in: [core/src/syntax-versions.ts:248](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/syntax-versions.ts#L248)

Get the minimum syntax version that supports a given block type.

## Parameters

### blockName

`string`

## Returns

`string` \| `undefined`

Version string, or undefined if the block is not in any known version