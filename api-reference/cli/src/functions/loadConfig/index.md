# loadConfig()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: loadConfig()

> **loadConfig**(`customPath?`, `files?`): `Promise`\<[`PromptScriptConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptScriptConfig/index.md)\>

Defined in: [cli/src/config/loader.ts:71](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/cli/src/config/loader.ts#L71)

Load the PromptScript configuration.
Follows `extends` chains, see loadConfigFile.

## Parameters

### customPath?

`string`

Optional custom config file path.

### files?

`string`[] = `[]`

Receives the absolute path of the config file and of every file its
`extends` chain reads, the config file first.

## Returns

`Promise`\<[`PromptScriptConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptScriptConfig/index.md)\>

The parsed configuration.

## Throws

Error if no config file is found or parsing fails.