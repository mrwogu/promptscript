# findConfigFile()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findConfigFile()

> **findConfigFile**(`customPath?`): `string` \| `null`

Defined in: [cli/src/config/loader.ts:41](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/config/loader.ts#L41)

Find the config file in the current directory.

## Parameters

### customPath?

`string`

Optional custom config file path.

## Returns

`string` \| `null`

The path to the config file, or null if not found.