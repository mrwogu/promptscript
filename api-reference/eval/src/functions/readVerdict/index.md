# readVerdict()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: readVerdict()

> **readVerdict**(`text`): [`JudgeVerdict`](https://getpromptscript.dev/api-reference/eval/src/interfaces/JudgeVerdict/index.md) \| `undefined`

Defined in: [eval/src/judge.ts:80](https://github.com/mrwogu/promptscript/blob/e7987a2976ad00f00c32cde1ccabfcf2a8346792/packages/eval/src/judge.ts#L80)

The verdict of one judge run: the response must be a JSON object with
exactly `verdict` (`pass` or `fail`) and `reason` (a string), each key once,
after the same trim and fence unwrap the assertions use. Anything else, such as the word
"pass" in free text, is no verdict.

## Parameters

### text

`string`

## Returns

[`JudgeVerdict`](https://getpromptscript.dev/api-reference/eval/src/interfaces/JudgeVerdict/index.md) \| `undefined`