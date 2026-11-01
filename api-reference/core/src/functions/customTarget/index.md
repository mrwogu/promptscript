# customTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: customTarget()

> **customTarget**(`name`): [`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

Defined in: [core/src/types/config.ts:884](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/core/src/types/config.ts#L884)

Create a `CustomTarget` value from a plain string.
Use this when registering custom formatters to get proper typing.

## Parameters

### name

`string`

The custom target name

## Returns

[`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

The name typed as `CustomTarget`