# hasOwnedEntries()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: hasOwnedEntries()

> **hasOwnedEntries**(`data`): `boolean`

Defined in: [formatters/src/structured-output.ts:155](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/structured-output.ts#L155)

Check whether a parsed settings object has any PromptScript-owned entries.

## Parameters

### data

`Record`\<`string`, `unknown`\>

The parsed settings object

## Returns

`boolean`

True if any entry has the ownership marker