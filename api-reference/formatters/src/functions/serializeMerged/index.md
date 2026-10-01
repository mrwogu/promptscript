# serializeMerged()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: serializeMerged()

> **serializeMerged**(`data`, `format`): `string`

Defined in: [formatters/src/structured-output.ts:140](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/formatters/src/structured-output.ts#L140)

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