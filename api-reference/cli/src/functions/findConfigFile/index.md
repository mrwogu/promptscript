# findConfigFile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findConfigFile()

> **findConfigFile**(`customPath?`): `string` \| `null`

Defined in: [cli/src/config/loader.ts:34](https://github.com/mrwogu/promptscript/blob/c034efd2ff22b5feace7485154a193a44950eeb3/packages/cli/src/config/loader.ts#L34)

Find the config file in the current directory.

## Parameters

### customPath?

`string`

Optional custom config file path.

## Returns

`string` \| `null`

The path to the config file, or null if not found.