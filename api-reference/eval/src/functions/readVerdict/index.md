# readVerdict()

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Function: readVerdict()

> **readVerdict**(`text`): [`JudgeVerdict`](https://getpromptscript.dev/api-reference/eval/src/interfaces/JudgeVerdict/index.md) \| `undefined`

Defined in: [eval/src/judge.ts:80](https://github.com/mrwogu/promptscript/blob/49aa50f943865b985366c4eda6e95c5a31ef39a6/packages/eval/src/judge.ts#L80)

The verdict of one judge run: the response must be a JSON object with
exactly `verdict` (`pass` or `fail`) and `reason` (a string), each key once,
after the same trim and fence unwrap the assertions use. Anything else, such as the word
"pass" in free text, is no verdict.

## Parameters

### text

`string`

## Returns

[`JudgeVerdict`](https://getpromptscript.dev/api-reference/eval/src/interfaces/JudgeVerdict/index.md) \| `undefined`