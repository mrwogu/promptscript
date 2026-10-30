# hasOwnedEntries()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: hasOwnedEntries()

> **hasOwnedEntries**(`data`): `boolean`

Defined in: [formatters/src/structured-output.ts:155](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/formatters/src/structured-output.ts#L155)

Check whether a parsed settings object has any PromptScript-owned entries.

## Parameters

### data

`Record`\<`string`, `unknown`\>

The parsed settings object

## Returns

`boolean`

True if any entry has the ownership marker