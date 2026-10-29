# findConfigFile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findConfigFile()

> **findConfigFile**(`customPath?`): `string` \| `null`

Defined in: [cli/src/config/loader.ts:41](https://github.com/mrwogu/promptscript/blob/e7e00ba1ca8ae28ce2faac3d48c7e8b14c93ddd0/packages/cli/src/config/loader.ts#L41)

Find the config file in the current directory.

## Parameters

### customPath?

`string`

Optional custom config file path.

## Returns

`string` \| `null`

The path to the config file, or null if not found.