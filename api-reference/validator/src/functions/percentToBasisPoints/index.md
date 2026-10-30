# percentToBasisPoints()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: percentToBasisPoints()

> **percentToBasisPoints**(`value`): `number` \| `undefined`

Defined in: [validator/src/policy/parser.ts:489](https://github.com/mrwogu/promptscript/blob/7de2fced4e580154b82fc17ad4152659742399c3/packages/validator/src/policy/parser.ts#L489)

A traffic percent with at most two decimals, in basis points, or undefined when the
value is not one. The tolerance absorbs binary float noise such as 0.07 * 100.

## Parameters

### value

`unknown`

## Returns

`number` \| `undefined`