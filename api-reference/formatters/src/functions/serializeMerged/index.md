# serializeMerged()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: serializeMerged()

> **serializeMerged**(`data`, `format`): `string`

Defined in: [formatters/src/structured-output.ts:140](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/formatters/src/structured-output.ts#L140)

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