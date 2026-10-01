# customTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: customTarget()

> **customTarget**(`name`): [`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

Defined in: [core/src/types/config.ts:695](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/types/config.ts#L695)

Create a `CustomTarget` value from a plain string.
Use this when registering custom formatters to get proper typing.

## Parameters

### name

`string`

The custom target name

## Returns

[`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

The name typed as `CustomTarget`