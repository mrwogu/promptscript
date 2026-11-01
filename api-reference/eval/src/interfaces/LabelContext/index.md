# LabelContext

[**PromptScript API**](https://getpromptscript.dev/api-reference/index.md)

***

# Interface: LabelContext

Defined in: [eval/src/labels.ts:10](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/labels.ts#L10)

What a label file is checked against.

## Properties

### assertionIds

> **assertionIds**: `ReadonlySet`\<`string`\>

Defined in: [eval/src/labels.ts:14](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/labels.ts#L14)

Ids of every assertion of the suite

***

### judgeIds

> **judgeIds**: `ReadonlySet`\<`string`\>

Defined in: [eval/src/labels.ts:12](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/labels.ts#L12)

Ids of the suite's llm-judge assertions

***

### suiteFile

> **suiteFile**: `string`

Defined in: [eval/src/labels.ts:16](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/labels.ts#L16)

Suite file, for messages

***

### writtenPath?

> `optional` **writtenPath?**: `string`

Defined in: [eval/src/labels.ts:18](https://github.com/mrwogu/promptscript/blob/bf736d7e84ce7d2e4bbf3950f9e04db454797a51/packages/eval/src/labels.ts#L18)

Path of the label file as written in the suite; its extension picks the format