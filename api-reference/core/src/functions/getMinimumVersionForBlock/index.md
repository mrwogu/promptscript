# getMinimumVersionForBlock()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getMinimumVersionForBlock()

> **getMinimumVersionForBlock**(`blockName`): `string` \| `undefined`

Defined in: [core/src/syntax-versions.ts:248](https://github.com/mrwogu/promptscript/blob/b1ffa964bf8ec81f090aed0faac2af9f181c885e/packages/core/src/syntax-versions.ts#L248)

Get the minimum syntax version that supports a given block type.

## Parameters

### blockName

`string`

## Returns

`string` \| `undefined`

Version string, or undefined if the block is not in any known version