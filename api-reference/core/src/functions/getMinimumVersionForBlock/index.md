# getMinimumVersionForBlock()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: getMinimumVersionForBlock()

> **getMinimumVersionForBlock**(`blockName`): `string` \| `undefined`

Defined in: [core/src/syntax-versions.ts:206](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/core/src/syntax-versions.ts#L206)

Get the minimum syntax version that supports a given block type.

## Parameters

### blockName

`string`

## Returns

`string` \| `undefined`

Version string, or undefined if the block is not in any known version