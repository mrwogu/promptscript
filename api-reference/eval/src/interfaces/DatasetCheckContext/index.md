# DatasetCheckContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: DatasetCheckContext

Defined in: [eval/src/dataset/check.ts:12](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/dataset/check.ts#L12)

What a dataset row is checked against.

## Properties

### assertions

> **assertions**: readonly [`EvalAssertion`](https://getpromptscript.dev/api-reference/core/src/type-aliases/EvalAssertion/index.md)[]

Defined in: [eval/src/dataset/check.ts:18](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/dataset/check.ts#L18)

Assertions of the suite

***

### bundle

> **bundle**: `Pick`\<[`PromptBundleV1`](https://getpromptscript.dev/api-reference/core/src/interfaces/PromptBundleV1/index.md), `"inputs"` \| `"output"`\>

Defined in: [eval/src/dataset/check.ts:16](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/dataset/check.ts#L16)

Contract of the prompt under test

***

### file

> **file**: `string`

Defined in: [eval/src/dataset/check.ts:14](https://github.com/mrwogu/promptscript/blob/97d04fa1f87d4f5dda79f91be5de292033c6d45a/packages/eval/src/dataset/check.ts#L14)

Dataset path relative to the project root