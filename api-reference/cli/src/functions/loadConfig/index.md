# loadConfig()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: loadConfig()

> **loadConfig**(`customPath?`): `Promise`\<[`PromptScriptConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptScriptConfig/index.md)\>

Defined in: [cli/src/config/loader.ts:61](https://github.com/mrwogu/promptscript/blob/5086c9aa8e44c92cc433800652e5eea6aa493e17/packages/cli/src/config/loader.ts#L61)

Load the PromptScript configuration.

## Parameters

### customPath?

`string`

Optional custom config file path.

## Returns

`Promise`\<[`PromptScriptConfig`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptScriptConfig/index.md)\>

The parsed configuration.

## Throws

Error if no config file is found or parsing fails.