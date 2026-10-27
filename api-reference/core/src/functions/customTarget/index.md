# customTarget()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: customTarget()

> **customTarget**(`name`): [`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

Defined in: [core/src/types/config.ts:882](https://github.com/mrwogu/promptscript/blob/c571f6501535aeefaef91013b9847d45ad53061d/packages/core/src/types/config.ts#L882)

Create a `CustomTarget` value from a plain string.
Use this when registering custom formatters to get proper typing.

## Parameters

### name

`string`

The custom target name

## Returns

[`CustomTarget`](https://getpromptscript.dev/api-reference/core/src/type-aliases/CustomTarget/index.md)

The name typed as `CustomTarget`