# cleanText()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: cleanText()

> **cleanText**(`text`): `string`

Defined in: [eval/src/sanitize.ts:17](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/sanitize.ts#L17)

Normalize a string that comes from a model, a provider or a dataset before
it is shown or written: line breaks become a space, control and bidi
characters are removed. Runs the same on and off a terminal.

## Parameters

### text

`string`

## Returns

`string`