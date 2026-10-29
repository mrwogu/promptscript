# serializeMerged()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: serializeMerged()

> **serializeMerged**(`data`, `format`): `string`

Defined in: [formatters/src/structured-output.ts:140](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/formatters/src/structured-output.ts#L140)

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