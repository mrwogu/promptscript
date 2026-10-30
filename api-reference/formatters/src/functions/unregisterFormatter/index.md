# unregisterFormatter()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: unregisterFormatter()

> **unregisterFormatter**(`name`): `boolean`

Defined in: [formatters/src/standalone.ts:188](https://github.com/mrwogu/promptscript/blob/19e211df8dd4e69090320a0a92074a3dde05e929/packages/formatters/src/standalone.ts#L188)

Unregister a formatter.

Primarily useful for testing to clean up registered formatters.

## Parameters

### name

`string`

Formatter identifier to remove

## Returns

`boolean`

True if the formatter was removed, false if not found