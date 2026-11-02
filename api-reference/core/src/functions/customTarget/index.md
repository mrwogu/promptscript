# customTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: customTarget()

> **customTarget**(`name`): [`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

Defined in: [core/src/types/config.ts:884](https://github.com/mrwogu/promptscript/blob/1b71bccda9a0dc10cb2e852cd08b5bb17ff09055/packages/core/src/types/config.ts#L884)

Create a `CustomTarget` value from a plain string.
Use this when registering custom formatters to get proper typing.

## Parameters

### name

`string`

The custom target name

## Returns

[`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

The name typed as `CustomTarget`