# compareCodeUnits()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: compareCodeUnits()

> **compareCodeUnits**(`a`, `b`): `number`

Defined in: [core/src/utils/canonical-json.ts:14](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/core/src/utils/canonical-json.ts#L14)

Compare two strings by UTF-16 code units, the order RFC 8785 requires.
Unlike `localeCompare` it gives the same order on every host.

## Parameters

### a

`string`

### b

`string`

## Returns

`number`