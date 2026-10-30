# serializeMerged()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: serializeMerged()

> **serializeMerged**(`data`, `format`): `string`

Defined in: [formatters/src/structured-output.ts:140](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/formatters/src/structured-output.ts#L140)

Serialize a merged settings object deterministically.

## Parameters

### data

`Record`\<`string`, `unknown`\>

The settings object to serialize

### format

`"json"` \| `"toml"`

Target format ('json' or 'toml')

## Returns

`string`

Serialized string