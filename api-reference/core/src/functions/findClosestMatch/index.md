# findClosestMatch()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: findClosestMatch()

> **findClosestMatch**(`input`, `candidates`, `maxDistance?`): \{ `distance`: `number`; `match`: `string`; \} \| `undefined`

Defined in: [core/src/utils/levenshtein.ts:39](https://github.com/mrwogu/promptscript/blob/a426289c08607d674cfba8adc7393396231ad6b9/packages/core/src/utils/levenshtein.ts#L39)

Find the closest match from a list of candidates.

## Parameters

### input

`string`

The input string to match

### candidates

readonly `string`[]

List of candidate strings

### maxDistance?

`number` = `2`

Maximum Levenshtein distance (default: 2)

## Returns

\{ `distance`: `number`; `match`: `string`; \} \| `undefined`

The closest match and its distance, or undefined if none within threshold