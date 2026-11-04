# customTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: customTarget()

> **customTarget**(`name`): [`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

Defined in: [core/src/types/config.ts:983](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/core/src/types/config.ts#L983)

Create a `CustomTarget` value from a plain string.
Use this when registering custom formatters to get proper typing.

## Parameters

### name

`string`

The custom target name

## Returns

[`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

The name typed as `CustomTarget`