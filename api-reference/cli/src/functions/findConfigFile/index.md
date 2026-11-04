# findConfigFile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findConfigFile()

> **findConfigFile**(`customPath?`): `string` \| `null`

Defined in: [cli/src/config/loader.ts:41](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/cli/src/config/loader.ts#L41)

Find the config file in the current directory.

## Parameters

### customPath?

`string`

Optional custom config file path.

## Returns

`string` \| `null`

The path to the config file, or null if not found.